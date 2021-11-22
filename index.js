import { getCurrentInstance, onUnmounted } from 'vue'
import { live as d3live, RangeBuckets } from '@live-change/dao-vue3'

function path(app) {
  app = app || getCurrentInstance()
  return app.appContext.config.globalProperties.$lc.fetch
}

function api(app) {
  app = app || getCurrentInstance()
  return app.appContext.config.globalProperties.$lc
}

function view(app) {
  app = app || getCurrentInstance()
  return app.appContext.config.globalProperties.$lc.view
}

function actions(app) {
  app = app || getCurrentInstance()
  return app.appContext.config.globalProperties.$lc.actions
}

function live(path) {
  const app = getCurrentInstance()
  const api = app.appContext.config.globalProperties.$lc
  return d3live(api, path)
}

async function rangeBuckets(pathFunction, options, app) {
  app = app || getCurrentInstance()
  const api = app.appContext.config.globalProperties.$lc
  const extendedPathFunction = (range) => pathFunction(range, api.fetch)
  const buckets = new RangeBuckets(api, extendedPathFunction, options)
  if(app) {
    onUnmounted(() => {
      buckets.dispose()
    })
  } else {
    console.error("live fetch outside component instance - possible memory leak")
  }
  await buckets.wait()
  return {
    buckets: buckets.buckets,
    loadTop: () => buckets.loadTop(),
    loadBottom: () => buckets.loadBottom(),
    dropTop: () => buckets.dropTop(),
    dropBottom: () => buckets.dropBottom(),
    canLoadTop: () => buckets.isTopLoadPossible(),
    canLoadBottom: () => buckets.isBottomLoadPossible(),
  }
}

function reverseRange(range) {
  return {
    gt: range.lt,
    gte: range.lte,
    lt: range.gt == '' ? '\xFF\xFF\xFF\xFF' : range.gt,
    lte: range.gte,
    limit: range.limit,
    reverse: !range.reverse
  }
}

function client(app) {
  app = app || getCurrentInstance()
  return app.appContext.config.globalProperties.$lc.client
}

function uid(app) {
  app = app || getCurrentInstance()
  return app.appContext.config.globalProperties.$lc.uid
}

export { path, api, view, actions, live, client, uid, rangeBuckets, reverseRange }
