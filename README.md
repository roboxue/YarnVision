# Yarn Vision

> Hadoop Web API UI

Yarn Vision is a UI wrapper for hadoop resource manager [API](https://hadoop.apache.org/docs/stable/hadoop-yarn/hadoop-yarn-site/ResourceManagerRest.html#Cluster_Application_Queue_API).
It provides you a friendly way to browse, filter, kill you yarn applications in one place.
Further more, it provides bookmark-able deep link so that you can save your application filters for later use

### Prerequiste
You need to have your yarn's resource manager deployed, and execute YarnVision code on a machine that can reach your resource manager

### How to run locally
1. Install Node.js and [npm](https://www.npmjs.com/get-npm)
2. Checkout this repo to a folder like `YarnVision`
3. run `npm install && npm run build`
4. run server.js and provide (a list of) address of your resource manager in the commandline arguments,
   like `node server.js http://my-yarn-resourcemanager.location:<port> http://my-other-yarn-resourcemanager.location:<port>`
5. open `http://localhost:3000`

### Use with docker
`docker run -p 8000:3000 -d roboxue/yarn_vision:latest http://my-yarn-resourcemanager.location:<port>` then open a browser and point to the port 8000 of your docker host

