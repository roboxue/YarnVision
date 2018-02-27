<template>
  <v-app id="inspire">
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
      <v-btn :loading="loading > 0" @click="loadApps">
        <v-icon>cached</v-icon>
        reload
      </v-btn>
      <v-text-field
        solo-inverted
        flat
        label="Search"
        prepend-icon="search"
      />
      <v-spacer/>
    </v-toolbar>
    <v-content>
      <YarnApplications
        :loading="loading > 0"
        :apps="apps"
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
        axios.get('/api/ws/v1/cluster/scheduler')
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
      }
    },
    watch: {
      appFilter: {
        handler (val) {
          this.loadApps()
        },
        deep: true
      }
    },
    mounted () {
      this.loadApps()
      this.loadQueues()
    }
  }
</script>

<style>
</style>
