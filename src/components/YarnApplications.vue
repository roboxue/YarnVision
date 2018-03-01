<template>
  <v-container fluid grid-list-md>
    <v-snackbar
      bottom
      :timeout="5000"
      v-model="snackbar"
    >
      {{ snackbarText }}
      <v-btn flat color="pink" @click.native="snackbar = false">Close</v-btn>
    </v-snackbar>
    <v-toolbar>
      <v-toolbar-title>{{apps.length}} Apps</v-toolbar-title>
      <v-spacer/>
      <v-btn-toggle mandatory v-model="viewStyleId">
        <v-btn flat>
          <v-icon>list</v-icon>
          list view
        </v-btn>
        <v-btn flat>
          <v-icon>dashboard</v-icon>
          card view
        </v-btn>
      </v-btn-toggle>
    </v-toolbar>

    <template v-if="viewStyle === 'table'">
      <p class="pl-2 pt-2 title">Click row to reveal actions</p>
      <v-data-table
        :loading="loading"
        :items="apps"
        :rows-per-page-items="rowsPerPageItems"
        :headers="visibleHeaders"
        :search="searchByAppName"
        :custom-filter="appFilter"
      >
        <template slot="items" slot-scope="props">
          <tr @click="props.expanded = !props.expanded" style="cursor: pointer;">
            <td v-for="(header, i) in visibleHeaders" :key="i">
              <AppInfoLine :item="props.item" :header="header" :humanizeTimestamp="humanize"/>
            </td>
          </tr>
        </template>
        <template slot="expand" slot-scope="props">
          <div>
            <v-btn
              target="_blank"
              :href="props.item.trackingUrl"
              v-if="props.item.trackingUrl">
              Tracking UI - {{props.item.trackingUI}}
            </v-btn>
            <v-btn
              target="_blank"
              :href="props.item.amContainerLogs"
              v-if="props.item.amContainerLogs">
              Logs
            </v-btn>
            <v-btn
              target="_blank"
              :href="`${resourceManager}/cluster/app/${props.item.id}`"
            >Resource Manager View
            </v-btn>
            <v-btn
              color="error"
              @click="attemptKillApp(props.item.id, props.item.name)"
            >Kill App
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </template>

    <v-data-iterator
      content-tag="v-layout"
      v-else-if="viewStyle === 'card'"
      :loading="loading"
      :items="apps"
      :rows-per-page-items="rowsPerPageItems"
      :search="searchByAppName"
      :custom-filter="appFilter"
      row
      wrap
    >
      <v-flex slot="item" slot-scope="props" xs12 sm6 md4 lg3>
        <v-card>
          <v-card-title><h4>{{props.item.name}}</h4></v-card-title>
          <v-divider/>
          <v-list dense two-line subheader v-for="(header, i) in visibleHeaders" :key="i">
            <v-list-tile avatar>
              <v-list-tile-content>
                <v-list-tile-title>{{header.text}}</v-list-tile-title>
                <v-list-tile-sub-title>
                  <AppInfoLine :item="props.item" :header="header" :humanizeTimestamp="humanize"/>
                </v-list-tile-sub-title>
              </v-list-tile-content>
            </v-list-tile>
          </v-list>
          <v-card-actions>
            <v-btn
              target="_blank"
              :href="props.item.trackingUrl"
              v-if="props.item.trackingUrl">
              Tracking
            </v-btn>
            <v-btn
              target="_blank"
              :href="props.item.amContainerLogs"
              v-if="props.item.amContainerLogs">
              Logs
            </v-btn>
            <v-btn
              target="_blank"
              :href="`${resourceManager}/cluster/app/${props.item.id}`">
              App
            </v-btn>
            <v-btn
              color="error"
              @click="attemptKillApp(props.item.id, props.item.name)">
              Kill
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-flex>
    </v-data-iterator>
  </v-container>
</template>

<script>
  import _ from 'lodash'
  import AppInfoLine from './AppInfoLine'
  import axios from 'axios'

  export default {
    data: () => ({
      viewStyleId: parseInt(localStorage.getItem('viewStyleId')) || 0,
      snackbar: false,
      snackbarText: '',
      rowsPerPageItems: [16, 32, 64, {text: 'All', value: -1}]
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
      attemptKillApp (appId, appName) {
        let vm = this
        let confirmedName = prompt('Type application name again to confirm killing the application')
        if (confirmedName != null && confirmedName === appName) {
          axios.put(`/hadoopapi/ws/v1/cluster/apps/${appId}/state`, {
            state: 'KILLED'
          }, {
            headers: {'X-Resource-Manager': vm.resourceManager}
          }).then((response) => {
            vm.snackbarText = `Requested to killed ${appName}, reload to confirm`
            vm.snackbar = true
          }).catch((error) => {

          })
        } else {
          vm.snackbarText = `App name mismatch, no action`
          vm.snackbar = true
        }
      },
      appFilter (items, search) {
        return items.filter(i => i.name.includes(search))
      }
    },
    watch: {
      viewStyleId (id) {
        localStorage.setItem('viewStyleId', id)
      }
    },
    props: ['apps', 'loading', 'resourceManager', 'searchByAppName', 'humanize', 'headers'],
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
