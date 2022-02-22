import { getCurrentInstance, onUnmounted } from 'vue'
import { live as d3live, RangeBuckets } from '@live-change/dao-vue3'

function api(context) {
  context = context || getCurrentInstance().appContext
  return context.config.globalProperties.$lc
}

function path(context) {
  return api(context).fetch
}

function view(context) {
  return api(context).view
}

function actions(context) {
  return api(context).actions
}

function live(path) {
  return d3live(api(), path)
}

async function rangeBuckets(pathFunction, options, app = getCurrentInstance()) {
  const lc = api()
  const extendedPathFunction = (range) => pathFunction(range, lc.fetch)
  const buckets = new RangeBuckets(lc, extendedPathFunction, options)
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

function client(context) {
  return api(context).client
}

function uid(context) {
  return api(context).uid
}

export { path, api, view, actions, live, client, uid, rangeBuckets, reverseRange }
