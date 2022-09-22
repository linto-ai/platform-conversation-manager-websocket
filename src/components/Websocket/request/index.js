import axios from "axios"

const BASE_API = process.env.API_HOST

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
    if (req.status >= 200 && req.status < 300) {
      return { status: "success", data: req.data }
    } else {
      throw req
    }
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
    {},
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

export async function updateUserRightInConversation(
  conversationId,
  userId,
  right,
  userToken
) {
  return await sendRequest(
    `${BASE_API}/conversations/${conversationId}/user/${userId}`,
    { method: "patch" },
    { right },
    null,
    userToken
  )
}
