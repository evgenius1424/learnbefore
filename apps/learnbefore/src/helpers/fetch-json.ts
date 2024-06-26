type ApiError = {
  message: string
}

// TODO: experimental
export async function fetchJson(url: string, init: RequestInit = {}) {
  const response = await fetch(url, init)
  if (!response.ok) {
    throw {
      message: experimentalErrorMessage,
    } as ApiError
  }

  try {
    return await response.json()
  } catch (error) {
    throw {
      message: experimentalErrorMessage,
    } as ApiError
  }
}

const experimentalErrorMessage = "An error occurred, please try again later."
