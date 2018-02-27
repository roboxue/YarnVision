<template>
  <v-container fluid grid-list-md>
    <v-layout row>
      <v-flex xs12>
        <v-btn-toggle mandatory v-model="viewStyleId">
          <v-btn flat color="primary">
            <v-icon>list</v-icon>
            list view
          </v-btn>
          <v-btn flat color="primary">
            <v-icon>dashboard</v-icon>
            card view
          </v-btn>
        </v-btn-toggle>
      </v-flex>
    </v-layout>

    <v-data-table
      v-if="viewStyle === 'table'"
      :loading="loading"
      :items="apps"
      :rows-per-page-items="rowsPerPageItems"
      :headers="visibleHeaders"
    >
      <template slot="items" slot-scope="props">
        <tr @click="props.expanded = !props.expanded">
          <td v-for="(header, i) in visibleHeaders" :key="i">
            <AppInfoLine :item="props.item" :header="header" :humanizeTimestamp="humanizeTimestamp"/>
          </td>
        </tr>
      </template>
      <template slot="expand" slot-scope="props">
        
      </template>
    </v-data-table>

    <v-data-iterator
      content-tag="v-layout"
      v-else-if="viewStyle === 'card'"
      :loading="loading"
      :items="apps"
      :rows-per-page-items="rowsPerPageItems"
      row
      wrap
    >
      <v-flex slot="item" slot-scope="props" xs12 sm6 md4 lg3>
        <v-card :color="colorByState(props.item.state)" class="white--text">
          <v-card-title><h4>{{props.item.name}}</h4></v-card-title>
          <v-divider/>
          <v-list dense two-line subheader v-for="(header, i) in visibleHeaders" :key="i">
            <v-list-tile avatar>
              <v-list-tile-content>
                <v-list-tile-title>{{header.text}}</v-list-tile-title>
                <v-list-tile-sub-title>
                  <AppInfoLine :item="props.item" :header="header" :humanizeTimestamp="humanizeTimestamp"/>
                </v-list-tile-sub-title>
              </v-list-tile-content>
            </v-list-tile>
          </v-list>
        </v-card>
      </v-flex>
    </v-data-iterator>
  </v-container>
</template>

<script>
  import _ from 'lodash'
  import AppInfoLine from './AppInfoLine'

  export default {
    data: () => ({
      viewStyleId: 0,
      humanizeTimestamp: true,
      rowsPerPageItems: [8, 16, 32, 64, {text: 'All', value: -1}],
      headers: [
        {text: 'App Id', sortable: true, value: 'id', visible: true},
        {text: 'State', sortable: true, value: 'state', visible: true},
        {text: 'Username', sortable: true, value: 'user', visible: true},
        {text: 'App Name', sortable: true, value: 'name', visible: true},
        {text: 'Queue', sortable: true, value: 'queue', visible: true},
        {text: 'Final Status', sortable: true, value: 'finalStatus', visible: true},

        {text: 'Allocated Memory(MB)', sortable: true, value: 'allocatedMB', visible: true},
        {text: 'Allocated Vcores', sortable: true, value: 'allocatedVCores', visible: true},
        {text: 'Running Containers', sortable: true, value: 'runningContainers', visible: true},
        {text: 'Queue Usage(%)', sortable: true, value: 'queueUsagePercentage', visible: true},
        {text: 'Memory Seconds', sortable: true, value: 'memorySeconds', visible: false},
        {text: 'Vcore Seconds', sortable: true, value: 'vcoreSeconds', visible: false},
        {text: 'Cluster Usage(%)', sortable: true, value: 'clusterUsagePercentage', visible: false},
        {text: 'Preempted Memory(MB)', sortable: true, value: 'preemptedResourceMB', visible: false},
        {text: 'Preempted Vcores', sortable: true, value: 'preemptedResourceVCores', visible: false},
        {text: 'Preempted Non AM Container', sortable: true, value: 'numNonAMContainerPreempted', visible: false},
        {text: 'Preempted AM Container', sortable: true, value: 'numAMContainerPreempted', visible: false},

        {text: 'TrackingUrl', sortable: false, value: 'trackingUrl', visible: true},
        {text: 'Container Logs', sortable: false, value: 'amContainerLogs', visible: true},
        {text: 'AM Host Address', sortable: true, value: 'amHostHttpAddress', visible: true},
        {text: 'AM RPC Address', sortable: false, value: 'amRPCAddress', visible: false},

        {text: 'Log Aggregation Status', sortable: true, value: 'logAggregationStatus', visible: true},
        {text: 'Progress', sortable: true, value: 'progress', visible: false},
        {text: 'Diagnostics', sortable: false, value: 'diagnostics', visible: false},
        {text: 'Cluster Id', sortable: false, value: 'clusterId', visible: false},
        {text: 'Application Type', sortable: true, value: 'applicationType', visible: true},
        {text: 'Application Tags', sortable: false, value: 'applicationTags', visible: false},
        {text: 'Priority', sortable: true, value: 'priority', visible: false},

        {text: 'Started Time', sortable: true, value: 'startedTime', visible: true},
        {text: 'Finished Time', sortable: true, value: 'finishedTime', visible: true},
        {text: 'Elapsed Time', sortable: true, value: 'elapsedTime', visible: true},

        {text: 'Unmanaged Application', sortable: true, value: 'unmanagedApplication', visible: false},
        {text: 'App Node Label Expression', sortable: false, value: 'appNodeLabelExpression', visible: false},
        {text: 'AM Node Label Expression', sortable: false, value: 'amNodeLabelExpression', visible: false}
      ]
    }),
    computed: {
      viewStyle () {
        let styles = ['table', 'card']
        return styles[this.viewStyleId]
      },
      visibleHeaders () {
        return _.filter(this.headers, 'visible')
      }
    },
    methods: {
      colorByState (state) {
        switch (state) {
          case 'RUNNING':
            return 'success'
          case 'FAILED':
            return 'error'
          case 'FINISHED':
            return 'primary'
          case 'KILLED':
            return 'warning'
          default:
            return 'grey darken-1'
        }
      }
    },
    props: ['apps', 'loading'],
    components: {
      AppInfoLine
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  h1, h2 {
    font-weight: normal;
  }

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    display: inline-block;
    margin: 0 10px;
  }

  a {
    color: #42b983;
  }
</style>
