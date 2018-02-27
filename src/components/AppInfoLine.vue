<template>
  <span v-if="header.value === 'state'" :class="`${colorByState(item.state)}--text`">
    {{item[header.value]}}
  </span>
  <span v-else-if="header.value === 'startedTime' || header.value === 'finishedTime'">
    {{humanizeIfNeeded(item[header.value])}}
  </span>
  <span v-else-if="header.value === 'elapsedTime'">
    {{humanizeDurationIfNeeded(item[header.value])}}
  </span>
  <span v-else>
    {{item[header.value]}}
  </span>

</template>

<script>
  import moment from 'moment'

  export default {
    data: () => {
      return {}
    },
    methods: {
      humanizeIfNeeded (timestamp) {
        if (timestamp === 0) {
          return "n/a"
        }
        return this.humanizeTimestamp ? `${moment(timestamp).toISOString()} (${moment(timestamp).fromNow()})` : timestamp
      },
      humanizeDurationIfNeeded (duration) {
        if (duration === 0) {
          return "n/a"
        }
        return this.humanizeTimestamp ? moment.duration(duration).humanize() : duration
      },
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
            return 'grey-darken-1'
        }
      }
    },
    props: ['item', 'header', 'humanizeTimestamp']
  }
</script>

<style scoped>

</style>
