<template>
  <v-app id="inspire" dark>
    <v-navigation-drawer
      fixed
      app
      clipped
      disable-resize-watcher
      v-model="drawer"
    >
      <v-container fluid>
        <v-layout row wrap>
          <v-flex xs12>
            <v-select
              :items="availableStates"
              v-model="appFilter.states"
              label="Filter by state"
              prepend-icon="apps"
              autocomplete
              chips
              deletableChips
              multiple
              max-height="400"
              bottom
              clearable
            />
          </v-flex>
        </v-layout>
        <v-layout row wrap>
          <v-flex xs12>
            <v-text-field
              prepend-icon="account_box"
              clearable
              label="Filter by username"
              v-model.lazy="appFilter.user"/>
          </v-flex>
        </v-layout>
        <v-layout row wrap>
          <v-flex xs12>
            <v-select
              prepend-icon="playlist_add"
              :items="availableQueues"
              v-model="appFilter.queue"
              label="Filter by queue"
              item-text="queueName"
              item-value="queueName"
              autocomplete
              chips
              deletableChips
              bottom
              clearable
            />
          </v-flex>
        </v-layout>
      </v-container>

    </v-navigation-drawer>
    <v-toolbar app absolute clipped-left>
      <v-toolbar-side-icon @click.native="drawer = !drawer"/>
      <span class="title ml-3 mr-5">Yarn&nbsp;Vision</span>
      <v-dialog v-model="resourceManagerDialog" persistent max-width="500px">
        <v-btn color="primary" dark slot="activator">{{resourceManager || 'Select a resource manager'}}</v-btn>
        <v-card>
          <v-card-title class="headline">Please select a resource manager</v-card-title>
          <v-card-text>
            <v-select :loading="loading > 0" :items="resourceManagers" v-model="resourceManager"/>
          </v-card-text>
          <v-card-actions>
            <v-btn flat :loading="loading > 0" @click="loadResourceManagers">
              <v-icon>refresh</v-icon> Refresh
            </v-btn>
            <v-spacer/>
            <v-btn flat
                   @click.native="closeResourceManagerDialog"
                   :disabled="resourceManager === ''"
                   :loading="loading > 0">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-btn :loading="loading > 0" @click="loadApps">
        <v-icon>cached</v-icon>
        reload
      </v-btn>
      <v-spacer/>
    </v-toolbar>
    <v-content>
      <YarnApplications
        :loading="loading > 0"
        :apps="apps"
        :resourceManager="resourceManager"
      />
    </v-content>
  </v-app>
</template>

<script>
  import YarnApplications from './components/YarnApplications'
  import axios from 'axios'
  import Qs from 'qs'
  import _ from 'lodash'

  export default {
    data: () => ({
      drawer: null,
      loading: 0,
      apps: [],
      resourceManagerDialog: false,
      resourceManagers: [],
      resourceManager: localStorage.getItem('resourceManager') || '',
      appFilter: {
        states: ['RUNNING'],
        user: '',
        queue: ''
      },
      availableStates: ['ACCEPTED', 'RUNNING', 'FINISHED', 'FAILED', 'KILLED'],
      availableQueues: [],
      errorMessage: ''
    }),
    components: {
      YarnApplications
    },
    methods: {
      loadApps () {
        let vm = this
        vm.loading ++
        axios.get('/api/ws/v1/cluster/apps', {
          headers: {'X-Resource-Manager': vm.resourceManager},
          params: {
            states: vm.appFilter.states.join(','),
            user: vm.appFilter.user,
            queue: vm.appFilter.queue
          },
          paramsSerializer: function (params) {
            return Qs.stringify(_.pickBy(params, _.identity), {arrayFormat: 'brackets'})
          }
        })
          .then((response) => {
            vm.loading --
            vm.apps = response.data.apps.app
          })
          .catch((error) => {
            vm.loading --
            vm.errorMessage = error
            vm.apps = []
          })
      },
      loadQueues () {
        let vm = this
        vm.loading ++
        axios.get('/api/ws/v1/cluster/scheduler', {
          headers: {'X-Resource-Manager': vm.resourceManager},
        })
          .then((response) => {
            vm.loading --
            let queues = []
            let iterateParentQueue = function (q) {
              if (_.has(q, 'queues')) {
                q.queues.queue.forEach(iterateParentQueue)
              } else {
                queues.push(q)
              }
            }
            iterateParentQueue(response.data.scheduler.schedulerInfo)
            vm.availableQueues = _.sortBy(queues, ['queueName'])
          })
          .catch((error) => {
            vm.loading --
            vm.errorMessage = error
            vm.availableQueues = []
          })
      },
      loadResourceManagers () {
        let vm = this
        vm.loading++
        axios.get('/resourcemanagers')
          .then((response) => {
            vm.resourceManagers = response.data
            vm.loading--
          })
          .catch((error) => {
            vm.loading--
            vm.errorMessage = error
          })
      },
      closeResourceManagerDialog () {
        this.resourceManagerDialog = false
        localStorage.setItem('resourceManager', this.resourceManager)
      }
    },
    watch: {
      appFilter: {
        handler (val) {
          this.loadApps()
        },
        deep: true
      },
      resourceManager: function (val) {
        this.loadApps()
        this.loadQueues()
      }
    },
    mounted () {
      this.loadResourceManagers()
      if (this.resourceManager === '') {
        this.resourceManagerDialog = true
      } else {
        this.loadApps()
        this.loadQueues()
      }
    }
  }
</script>

<style>
</style>
