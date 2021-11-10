import { getCurrentInstance } from 'vue'
import { live as d3live } from '@live-change/dao-vue3'

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

function client(app) {
  app = app || getCurrentInstance()
  return app.appContext.config.globalProperties.$lc.client
}

function uid(app) {
  app = app || getCurrentInstance()
  return app.appContext.config.globalProperties.$lc.uid
}

export { path, api, view, actions, live, client, uid }
