import { getCurrentInstance } from 'vue'
import { live as d3live } from '@live-change/dao-vue3'

function path(app) {
  app = app || getCurrentInstance()
  return app.appContext.config.globalProperties.$fetch
}

function api(app) {
  app = app || getCurrentInstance()
  return app.appContext.config.globalProperties.$api
}

function view(app) {
  app = app || getCurrentInstance()
  return app.appContext.config.globalProperties.$view
}

function actions(app) {
  app = app || getCurrentInstance()
  return app.appContext.config.globalProperties.$actions
}

function live(path) {
  const app = getCurrentInstance()
  const api = app.appContext.config.globalProperties.$api
  return d3live(api, path)
}

function client(app) {
  app = app || getCurrentInstance()
  return app.appContext.config.globalProperties.$client
}

export { path, api, view, actions, live, client }
