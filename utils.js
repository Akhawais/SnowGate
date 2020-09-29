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
    return res.status(200).json(result)
  } catch (e) {
    const status = e.response ? e.response.status : 500
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
