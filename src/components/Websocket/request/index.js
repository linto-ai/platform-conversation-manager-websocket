import axios from "axios"

const BASE_API = process.env.VUE_APP_CONVO_API

async function sendRequest(url, params, data, headers, userToken) {
  try {
    let req = await axios(url, {
      ...params,
      data,
      headers: {
        ...headers,
        Authorization: `Bearer ${userToken}`,
      },
    })
    return req.data
  } catch (error) {
    console.error(error)
  }
}

export async function getConversationById(conversationId, userToken) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}`,
    {
      method: "GET",
    },
    null,
    null,
    userToken
  )
}

export async function deleteConversation(conversationId, userToken) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}`,
    { method: "delete" },
    null,
    null,
    userToken
  )
}

export async function updateConversation(conversationId, payload, userToken) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}`,
    { method: "patch" },
    payload,
    null,
    userToken
  )
}
