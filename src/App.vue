<template>
  <v-app id="inspire">
    <v-navigation-drawer
      fixed
      app
      clipped
      disable-resize-watcher
      v-model="drawer"
    >
      <v-list subheader>
        <v-subheader>Filter by state</v-subheader>
        <v-list-tile avatar v-for="(state, i) in availableStates"
        :key="i">
          <v-list-tile-action>
            <v-checkbox v-model="appFilter.states" :value="state"/>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>{{state}}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
      <v-list>
        <v-subheader>Filter By Username</v-subheader>
        <v-list-tile>
          <v-list-tile-action>
            <v-icon>account_box</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-text-field solo label="Some Username" v-model.lazy="appFilter.user"/>
          </v-list-tile-content>
        </v-list-tile>
        <v-subheader>Filter By Queue</v-subheader>
        <v-list-tile>
          <v-list-tile-action>
            <v-icon>playlist_add</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-text-field solo label="Some Queue" v-model.lazy="appFilter.queue"/>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar app absolute clipped-left>
      <v-toolbar-side-icon @click.native="drawer = !drawer"/>
      <span class="title ml-3 mr-5">Yarn&nbsp;Vision</span>
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
      apps: [],
      appFilter: {
        states: ["RUNNING"],
        user: "",
        queue: ""
      },
      availableStates: ["ACCEPTED", "RUNNING", "FINISHED", "FAILED", "KILLED"],
      errorMessage: ""
    }),
    components: {
      YarnApplications
    },
    methods: {
      loadApps () {
        let vm = this
        axios.defaults.baseURL = 'http://localhost:3000'
        axios.get("/api/ws/v1/cluster/apps", {
          params: {
            states: vm.appFilter.states.join(","),
            user: vm.appFilter.user,
            queue: vm.appFilter.queue
          },
          paramsSerializer: function(params) {
            return Qs.stringify(_.pickBy(params, _.identity), {arrayFormat: 'brackets'})
          }
        }).then((response) => {
          vm.apps = response.data.apps.app
        }).catch((error) => {
          vm.errorMessage = error
          vm.apps = []
        })
      }
    },
    watch: {
      appFilter: {
        handler(val) {
          this.loadApps()
        },
        deep: true
      }
    },
    mounted () {
      this.loadApps()
    }
  }
</script>

<style>
  #keep main .container {
    height: 660px;
  }

  .navigation-drawer__border {
    display: none;
  }

  .text {
    font-weight: 400;
  }
</style>
