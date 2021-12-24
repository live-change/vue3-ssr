import { DaoProxy, DaoPrerenderCache, DaoCache, Path } from "@live-change/dao"
import validators from '@live-change/framework/lib/utils/validators.js'
import { hashCode, encodeNumber, uidGenerator } from '@live-change/uid'
import { ref, computed, watch } from "vue"

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4()
}

class Api extends DaoProxy {
  constructor(source, settings = {}) {
    super()
    this.source = source
    this.settings = settings

    this.uidGenerator = () => { throw new Error("uid generator not initialized yet") }

    this.createReactiveObject = this.settings.createReactiveObject

    this.preFetchComponents = []
    this.afterPreFetch = []

    this.validators = validators

    this.globals = {
      $validators: validators
    }
    this.globalInstances = []
  }

  setup(settings = this.settings) {
    this.settings = settings
    this.createReactiveObject = this.settings.createReactiveObject
    this.setupCaches()
    this.setupMetadata()
  }

  guid() {
    return guid()
  }

  setupCaches() {
    let dao = this.source
    if(this.settings.cache) {
      const cacheSettings = (typeof this.settings.cache) == 'object' ? this.settings.cache : {}
      this.dataCache = new DaoCache(dao, cacheSettings)
      dao = this.dataCache
    }
    if(this.settings.ssr) {
      this.prerenderCache = new DaoPrerenderCache(dao)
      dao = this.prerenderCache
      if(typeof window == 'undefined') {
        this.prerenderCache.mode = 'save'
      } else {
        this.prerenderCache.mode = 'load'
        this.prerenderCache.setCache(window[this.settings.ssrCacheGlobal || '__DAO_CACHE__'])
      }
    }
    this.setDao(dao)
  }

  setupMetadata() {
    const api = ref()
    this.apiObservable = this.observable(['metadata', 'api'])
    this.apiObservable.bindProperty(api, 'value')
    const version = ref()
    this.versionObservable = this.observable(['version', 'version'])
    this.versionObservable.bindProperty(version, 'value')
    const softwareVersion = computed(() => {
      if(typeof window == 'undefined') return
      return window[this.settings.ssrVersionGlobal || '__VERSION__']
    })
    const versionMismatch = computed(() => {
      if(!version) return
      if(!softwareVersion) return
      return version.value != softwareVersion.value
    })
    const client = computed(() => {
      return api?.value?.client
    })
    watch(() => api, (api) => {
      console.log("API CHANGE!", api)
      if(!api) return
      console.log("API CHANGE!", api)
      api.generateServicesApi()
    })
    this.metadata = {
      api, version,
      softwareVersion,
      versionMismatch,
      client
    }
    this.afterPreFetch.push(() => this.generateServicesApi())
  }

  generateServicesApi() {
    const api = this
    let apiInfo = api.metadata.api?.value
    if(!apiInfo) {
      const cachePath = '["metadata","api"]'
      if(typeof window != 'undefined') {
        const ssrCache = window[this.settings.ssrCacheGlobal || '__DAO_CACHE__']
        if(ssrCache) {
          for(const [daoPath, value] of ssrCache) {
            if(daoPath == cachePath) apiInfo = value
          }
        }
      } else {
        apiInfo = this.prerenderCache.cache.get(cachePath)
      }
    }
    console.log("GENERATE SERVICES API", apiInfo)
    const definitions = apiInfo?.services
    if(JSON.stringify(definitions) == JSON.stringify(api.servicesApiDefinitions)) return
    if(!definitions) throw new Error("API DEFINITIONS NOT FOUND! UNABLE TO GENERATE API!")
    api.uidGenerator = uidGenerator(apiInfo.client.user || apiInfo.client.session.slice(0, 16), 1)
    //console.log("GENERATE API DEFINITIONS", definitions)
    api.servicesApiDefinitions = definitions
    let globalViews = {}
    let globalFetch = (...args) => new Path(...args)
    let globalActions = {}
    for(const serviceDefinition of definitions) {
      let views = { }
      globalViews[serviceDefinition.name] = views
      for(const viewName in serviceDefinition.views) {
        views[viewName] = (params) => [serviceDefinition.name, viewName, params]
        views[viewName].definition = serviceDefinition.views[viewName]
      }
      let fetch = { }
      globalFetch[serviceDefinition.name] = fetch
      for(const viewName in serviceDefinition.views) {
        fetch[viewName] = (params) => new Path([serviceDefinition.name, viewName, params])
        fetch[viewName].definition = serviceDefinition.views[viewName]
      }
      let actions = { }
      globalActions[serviceDefinition.name] = actions
      for(const actionName in serviceDefinition.actions) {
        actions[actionName] = (params) => api.command([serviceDefinition.name, actionName], params)
        actions[actionName].definition = serviceDefinition.actions[actionName]
      }
    }

    api.views = globalViews
    api.fetch = globalFetch
    api.actions = globalActions
    api.client = this.metadata.client
    api.uid = api.uidGenerator

    api.globals.$lc = api

    /// Deprecated:
    api.globals.$api = this
    api.globals.$views = this.views
    api.globals.$actions = this.actions
    api.globals.$fetch = this.fetch

    for(const glob of this.globalInstances) {
      this.installInstanceProperties(glob)
    }
  }

  addGlobalInstance(globalProperties) {
    this.globalInstances.push(globalProperties)
    this.installInstanceProperties(globalProperties)
  }

  installInstanceProperties(globalProperties) {
    for(const key in this.globals) {
      globalProperties[key] = this.globals[key]
    }
  }

  async preFetch() {
    let preFetchPromises = []
    for(const component of this.preFetchComponents) {
      if(component.$options.reactivePreFetch) {
        const paths = component.$options.reactivePreFetch.apply(this.globals)
        console.log("PREFETCH PATHS", JSON.stringify(paths))
        const promise = this.get({ paths })/*.then(results => {
          for(let { what, data } of results) {
            this.prerenderCache.set(what, data)
          }
        })*/// It's useless because DaoPrerenderCache support paths
        preFetchPromises.push(promise)
      }
    }
    preFetchPromises.push(this.get({ paths: [
      { what: ['metadata', 'api'] },
      { what: ['version', 'version'] }
    ]}))
    console.log("PREFETCH WAIT!")
    // const apiPromise = this.apiObservable.wait()
    // apiPromise.then(res => console.log("API RES", res))
    // const versionPromise = this.versionObservable.wait()
    // versionPromise.then(res => console.log("VERSION RES", res))
    // if(this.apiObservable.getValue() === undefined) preFetchPromises.push(apiPromise)
    // if(this.versionObservable.getValue() === undefined) preFetchPromises.push(versionPromise)
    await Promise.all(preFetchPromises)
    console.log("PREFETCHED", this.metadata.api, this.metadata.version)
    for(const afterPreFetch of this.afterPreFetch) {
      afterPreFetch()
    }
  }

  async preFetchRoute(route, router) {
    let preFetchPromises = []
    for(const matched of route.value.matched) {
      for(const name in matched.components) {
        const component = matched.components[name]
        if(component.reactivePreFetch) {
          let paths = component.reactivePreFetch.call(this.globals, route.value, router)
          //console.log("ROUTE", route, "PREFETCH PATHS", JSON.stringify(paths))
          const promise = this.get({ paths }).then(results => {
            for(let { what, data } of results) {
              this.prerenderCache.set(what, data)
            }
          })
          preFetchPromises.push(promise)
        }
      }
    }
    return Promise.all(preFetchPromises)
  }

  command(method, args = {}) {
    const _commandId = args._commandId || guid()
    console.trace("COMMAND "+_commandId+":"+JSON.stringify(method))
    return this.request(method, { ...args, _commandId })
  }

  reverseRange(range) {
    return {
      gt: range.lt,
      gte: range.lte,
      lt: range.gt == '' ? '\xFF\xFF\xFF\xFF' : range.gt,
      lte: range.gte,
      limit: range.limit,
      reverse: !range.reverse
    }
  }
}

export default Api