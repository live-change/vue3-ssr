import { createReactiveObject } from '@live-change/vue3-components'
import Api from './Api.js'
import { reactiveMixin, reactivePrefetchMixin } from '@live-change/dao-vue3'


async function serverApi(dao, settings = {}) {
  const api = new Api(dao)
  api.setup({
    ssr: true,
    createReactiveObject(definition) {
      return createReactiveObject(definition, reactiveMixin(api)/*, reactivePrefetchMixin(api)*/ )
    }
  })
  for(const plugin of (settings.use || [])) {
    plugin(api)
  }
  api.generateServicesApi()
  await api.preFetch()
  return api
}

export { serverApi }
export default serverApi
