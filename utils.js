const wrapRequest = async (eris, resource, method, res, ...args) => {
  try {
    const erisResourceFunction = eris[`getREST${resource.charAt(0).toUpperCase() + resource.slice(1)}`].bind(eris)
    const erisResource = await erisResourceFunction(...args.slice(0, erisResourceFunction.length))
    let result = erisResource
    if (method !== `get${resource.charAt(0).toUpperCase() + resource.slice(1)}`) {
      const functionArguments = args.slice(erisResourceFunction.length).map(i => {
        if (typeof i === 'object' && i.content === undefined) {
          return Object.keys(i).map(j => {
            if (!Number.isNaN(parseInt(i[j]))) {
              return parseInt(i[j])
            }
            return i[j]
          })
        }
        return i
      }).flat()

      result = erisResource[method.replace(resource.charAt(0).toUpperCase() + resource.slice(1), '').replace('get', 'getREST')]
      if (result === undefined) {
        result = erisResource[method.replace(resource.charAt(0).toUpperCase() + resource.slice(1), '')]
      }
      result = await result.bind(erisResource)(...functionArguments)
    }
    const addOnProperties = {}
    if (Array.isArray(result)) {
      if (result[0].guild) {
        addOnProperties.guild_id = result[0].guild.id
      }
    } else if (result.guild) {
      addOnProperties.guild_id = result.guild.id
    }
    result = JSON.parse(JSON.stringify(result))
    const objectMap = (obj, fn) =>
      Object.fromEntries(
        Object.entries(obj).map(
          ([k, v], i) => fn(k, v, i)
        )
      )
    if (Array.isArray(result)) {
      result = result.map(item => {
        return { ...objectMap(item, (k, v) => {
          return [k.replace('ID', 'Id').replace('URL', 'Url').replace(/([A-Z])/g, '_$1').toLowerCase(), v]
        }),
        ...addOnProperties }
      })
    } else if (typeof result === 'object') {
      result = { ...objectMap(result, (k, v) => {
        return [k.replace('ID', 'Id').replace('URL', 'Url').replace(/([A-Z])/g, '_$1').toLowerCase(), v]
      }),
      ...addOnProperties }
    }
    return res.status(200).json(result)
  } catch (e) {
    const status = e.res ? e.res.statusCode : 500
    const response = {
      status,
      error: e.toString(),
      stack: e.stack
    }
    if (e.response) {
      Object.assign(response, e.response.data)
    }
    return res.status(status).json(response)
  }
}

module.exports = { wrapRequest }
