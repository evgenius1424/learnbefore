export function readFileAsString(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (event.target?.readyState === FileReader.DONE) {
        const text = event.target.result as string
        resolve(text)
      }
    }

    reader.onerror = (error) => {
      reject(error)
    }

    reader.readAsText(file)
  })
}
