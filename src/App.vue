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
              v-model="appFilter.states"
              :items="availableStates"
              label="Filter by state"
              prepend-icon="apps"
              autocomplete
              chips
              deletableChips
              multiple
              bottom
              clearable
            />
            <v-select
              v-model="appFilter.user"
              :items="availableUsers"
              label="Filter by username"
              prepend-icon="account_box"
              autocomplete
              clearable
              bottom
            />
            <v-select
              v-model="appFilter.queue"
              :items="availableQueues"
              label="Filter by queue"
              prepend-icon="playlist_add"
              item-text="queueName"
              item-value="queueName"
              autocomplete
              bottom
              clearable
            />
            <v-select
              v-model="appFilter.appTypes"
              :items="availableAppTypes"
              label="Filter by app type"
              prepend-icon="description"
              autocomplete
              chips
              deletableChips
              multiple
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
              <v-icon>refresh</v-icon>
              Refresh
            </v-btn>
            <v-spacer/>
            <v-btn flat
                   @click.native="closeResourceManagerDialog"
                   :disabled="resourceManager === ''"
                   :loading="loading > 0">Close
            </v-btn>
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
  import _ from 'lodash'
  import URI from 'urijs'

  export default {
    data: () => {
      const qs = URI(location).search(true)
      let filterStates = _.get(qs, 'states')
      filterStates = filterStates ? filterStates.split(',') : ['RUNNING']
      let filterAppTypes = _.get(qs, 'applicationTypes')
      filterAppTypes = filterAppTypes ? filterAppTypes.split(',') : []
      let filterUser = _.get(qs, 'user', '')

      return {
        drawer: null,
        loading: 0,
        apps: [],
        resourceManagerDialog: false,
        resourceManagers: [],
        resourceManager: localStorage.getItem('resourceManager') || '',
        appFilter: {
          states: filterStates,
          appTypes: filterAppTypes,
          user: filterUser,
          queue: ''
        },
        availableStates: ['ACCEPTED', 'RUNNING', 'FINISHED', 'FAILED', 'KILLED'],
        availableQueues: [],
        availableAppTypes: filterAppTypes,
        availableUsers: filterUser ? [filterUser] : [],
        errorMessage: ''
      }
    },
    components: {
      YarnApplications
    },
    methods: {
      getSearchParams () {
        let vm = this
        return _.pickBy({
          states: vm.appFilter.states.join(','),
          user: vm.appFilter.user,
          applicationTypes: vm.appFilter.appTypes.join(','),
          queue: vm.appFilter.queue
        }, _.identity)
      },
      loadApps () {
        let vm = this
        vm.loading++
        axios.get('/hadoopapi/ws/v1/cluster/apps', {
          headers: {'X-Resource-Manager': vm.resourceManager},
          params: vm.getSearchParams()
        })
          .then((response) => {
            console.log(_.uniq(response.data.apps.app.map(app => app.applicationType)))
            vm.loading--
            vm.availableAppTypes = _.union(vm.availableAppTypes, response.data.apps.app.map(app => app.applicationType))
            vm.availableUsers = _.union(vm.availableUsers, response.data.apps.app.map(app => app.user)).sort()
            vm.apps = response.data.apps.app
          })
          .catch((error) => {
            vm.loading--
            vm.errorMessage = error
            vm.apps = []
          })
      },
      loadQueues () {
        let vm = this
        vm.loading++
        axios.get('/hadoopapi/ws/v1/cluster/scheduler', {
          headers: {'X-Resource-Manager': vm.resourceManager},
        })
          .then((response) => {
            vm.loading--
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
            vm.loading--
            vm.errorMessage = error
            vm.availableQueues = []
          })
      },
      loadResourceManagers () {
        let vm = this
        vm.loading++
        axios.get('/api/resourcemanagers')
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
          let vm = this
          vm.loadApps()
          window.history.pushState(null, '', URI(location).search(vm.getSearchParams()))
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
