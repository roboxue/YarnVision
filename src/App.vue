<template>
  <v-app id="inspire" :dark="ui.dark">
    <v-navigation-drawer
      fixed
      app
      v-model="ui.drawer"
    >
      <v-container fluid>
        <v-layout row wrap>
          <v-flex xs12>
            <v-list three-line>
              <v-list-tile>
                <v-list-tile-content>
                  <v-list-tile-title>Resource Manager</v-list-tile-title>
                  <v-list-tile-sub-title>
                    <span>{{resourceManager}}</span>
                  </v-list-tile-sub-title>
                </v-list-tile-content>
              </v-list-tile>
            </v-list>
            <v-dialog v-model="ui.resourceManagerDialog" persistent max-width="500px">
              <v-btn color="primary" dark slot="activator">Change ...</v-btn>
              <v-card>
                <v-card-title class="headline">Please select a resource manager</v-card-title>
                <v-card-text>
                  <v-select :loading="loading > 0"
                            label="Resource Manager"
                            :items="resourceManagers" v-model="resourceManager"/>
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
            <v-divider/>
            <v-switch :label="`${ui.dark ? 'Dark' : 'Light'} Theme`" v-model="ui.dark"/>
            <v-switch label="Humanize timestamp" v-model="ui.humanize"/>
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
            <v-text-field
              v-model="searchByAppName"
              label="Filter by app name"
              prepend-icon="search"
            />
            <v-divider/>
            <v-list>
              <v-list-group no-action>
                <v-list-tile slot="activator">
                  <v-list-tile-content>
                    <v-list-tile-title>Data Fields Visibility</v-list-tile-title>
                  </v-list-tile-content>
                </v-list-tile>
                <v-list-tile v-for="(header, i) in headers" :key="i" @click="header.visible = !header.visible">
                  <v-list-tile-content>
                    <v-list-tile-title>{{ header.text }}</v-list-tile-title>
                  </v-list-tile-content>
                  <v-list-tile-action>
                    <v-icon :color="header.visible ? 'grey' : 'red'">
                      {{ header.visible ? 'visibility' : 'visibility_off' }}
                    </v-icon>
                  </v-list-tile-action>
                </v-list-tile>
              </v-list-group>
            </v-list>
          </v-flex>
        </v-layout>
      </v-container>

    </v-navigation-drawer>
    <v-toolbar app fixed>
      <v-toolbar-side-icon @click.native="ui.drawer = !ui.drawer"/>
      <v-toolbar-title>Yarn&nbsp;Vision v{{meta.version}}</v-toolbar-title>
      <v-btn :loading="loading > 0" @click="loadApps">
        <v-icon>cached</v-icon>
        reload
      </v-btn>
      <v-spacer/>
      <v-btn :href="meta.repository.url" target="_blank">
        <v-icon>code</v-icon>
        {{meta.repository.type}}
      </v-btn>
    </v-toolbar>
    <v-content>
      <YarnApplications
        :loading="loading > 0"
        :apps="apps"
        :resourceManager="resourceManager"
        :searchByAppName="searchByAppName"
        :humanize="ui.humanize"
        :headers="headers"
      />
    </v-content>
  </v-app>
</template>

<script>
  import YarnApplications from './components/YarnApplications'
  import axios from 'axios'
  import _ from 'lodash'
  import URI from 'urijs'
  import meta from '../package.json'

  export default {
    data: () => {
      const qs = URI(location).search(true)
      let filterStates = _.get(qs, 'states')
      filterStates = filterStates ? filterStates.split(',') : ['RUNNING']
      let filterAppTypes = _.get(qs, 'applicationTypes')
      filterAppTypes = filterAppTypes ? filterAppTypes.split(',') : []
      let filterUser = _.get(qs, 'user', '')

      return {
        meta: meta,
        ui: {
          drawer: null,
          dark: localStorage.getItem('theme') === 'dark',
          humanize: localStorage.getItem('humanize') !== false,
          resourceManagerDialog: false
        },
        loading: 0,
        apps: [],
        resourceManagers: [],
        resourceManager: localStorage.getItem('resourceManager') || '',
        appFilter: {
          states: filterStates,
          appTypes: filterAppTypes,
          user: filterUser,
          queue: ''
        },
        searchByAppName: '',
        availableStates: ['ACCEPTED', 'RUNNING', 'FINISHED', 'FAILED', 'KILLED'],
        availableQueues: [],
        availableAppTypes: filterAppTypes,
        availableUsers: filterUser ? [filterUser] : [],
        errorMessage: '',
        headers: [
          {text: 'App Name', sortable: true, value: 'name', visible: true},
          {text: 'State', sortable: true, value: 'state', visible: true},
          {text: 'Username', sortable: true, value: 'user', visible: true},
          {text: 'App Id', sortable: true, value: 'id', visible: true},
          {text: 'Queue', sortable: true, value: 'queue', visible: true},
          {text: 'Final Status', sortable: true, value: 'finalStatus', visible: false},

          {text: 'Started Time', sortable: true, value: 'startedTime', visible: true},
          {text: 'Finished Time', sortable: true, value: 'finishedTime', visible: true},
          {text: 'Elapsed Time', sortable: true, value: 'elapsedTime', visible: true},

          {text: 'AM Host Address', sortable: true, value: 'amHostHttpAddress', visible: true},
          {text: 'AM RPC Address', sortable: false, value: 'amRPCAddress', visible: false},

          {text: 'Allocated Vcores', sortable: true, value: 'allocatedVCores', visible: true},
          {text: 'Allocated Memory(MB)', sortable: true, value: 'allocatedMB', visible: true},
          {text: 'Running Containers', sortable: true, value: 'runningContainers', visible: true},
          {text: 'Queue Usage(%)', sortable: true, value: 'queueUsagePercentage', visible: true},
          {text: 'Memory Seconds', sortable: true, value: 'memorySeconds', visible: false},
          {text: 'Vcore Seconds', sortable: true, value: 'vcoreSeconds', visible: false},
          {text: 'Cluster Usage(%)', sortable: true, value: 'clusterUsagePercentage', visible: false},
          {text: 'Preempted Memory(MB)', sortable: true, value: 'preemptedResourceMB', visible: false},
          {text: 'Preempted Vcores', sortable: true, value: 'preemptedResourceVCores', visible: false},
          {text: 'Preempted Non AM Container', sortable: true, value: 'numNonAMContainerPreempted', visible: false},
          {text: 'Preempted AM Container', sortable: true, value: 'numAMContainerPreempted', visible: false},

          {text: 'Log Aggregation Status', sortable: true, value: 'logAggregationStatus', visible: true},
          {text: 'Progress', sortable: true, value: 'progress', visible: false},
          {text: 'Diagnostics', sortable: false, value: 'diagnostics', visible: false},
          {text: 'Cluster Id', sortable: false, value: 'clusterId', visible: false},
          {text: 'Application Type', sortable: true, value: 'applicationType', visible: true},
          {text: 'Application Tags', sortable: false, value: 'applicationTags', visible: false},
          {text: 'Priority', sortable: true, value: 'priority', visible: false},

          {text: 'Unmanaged Application', sortable: true, value: 'unmanagedApplication', visible: false},
          {text: 'App Node Label Expression', sortable: false, value: 'appNodeLabelExpression', visible: false},
          {text: 'AM Node Label Expression', sortable: false, value: 'amNodeLabelExpression', visible: false}
        ]
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
        this.ui.resourceManagerDialog = false
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
      },
      'ui.dark': function (dark) {
        localStorage.setItem('theme', dark ? 'dark' : 'light')
      },
      'ui.humanize': function (humanize) {
        localStorage.setItem('humanize', humanize)
      }
    },
    mounted () {
      this.loadResourceManagers()
      if (this.resourceManager === '') {
        this.ui.resourceManagerDialog = true
      } else {
        this.loadApps()
        this.loadQueues()
      }
    }
  }
</script>

<style>
</style>
