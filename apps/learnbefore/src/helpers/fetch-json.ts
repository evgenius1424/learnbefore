type ApiError = {
  message: string
}

const experimentalErrorMessage = "An error occurred, please try again later."

// TODO: experimental
export async function fetchJson(url: string, init: RequestInit = {}) {
  const response = await fetch(url, init)

  if (!response.ok) {
    console.error(`Error response received for request to ${url}:`, response)
    throw {
      message: experimentalErrorMessage,
    } as ApiError
  }

  try {
    return await response.json()
  } catch (error) {
    console.error(`Error parsing JSON response for request to ${url}:`, error)
    throw {
      message: experimentalErrorMessage,
    } as ApiError
  }
}
