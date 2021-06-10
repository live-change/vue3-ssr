import { createReactiveObject } from '@live-change/vue3-components'
import { Api } from '@live-change/vue-api'
import { reactiveMixin, reactivePrefetchMixin } from '@live-change/dao-vue3'


async function serverApi(dao) {
  const api = new Api(dao)
  api.setup({
    ssr: true,
    createReactiveObject(definition) {
      return createReactiveObject(definition, reactiveMixin(api)/*, reactivePrefetchMixin(api)*/ )
    }
  })
  api.generateServicesApi()
  await api.preFetch()
  return api
}

export { serverApi }