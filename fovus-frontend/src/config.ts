

export const config = {
    apiHost: import.meta.env.VITE_API_ENDPOINT_URL,

    s3Resource: {
        preSignedPath: 's3/presignedurl'
    },

    dyanamodbResource: {
        userinputPath: 'dyanamodb/userinput'
    }
}