import { getJobs } from "../request/index.js"
import Conversations from "../models/conversations.js"

const jobsFetcher = {}

export default async function jobTranscriptionController(
  conversation,
  conversationId,
  userToken,
  io
) {
  if (!jobsFetcher[conversationId]) {
    jobsFetcher[conversationId] = true
    fetchJob(conversation, conversationId, userToken, io)
  }
}

async function fetchJob(conversation, conversationId, userToken, io) {
  const currentState = conversation.getTranscriptionJob()?.state

  if (currentState == "started") {
    const req = await getJobs(conversationId, userToken)
    const state = req?.data?.jobs?.transcription?.state

    setTimeout(
      () => fetchJob(conversation, conversationId, userToken, io),
      3000
    )

    if (state && state != "started") {
      conversation.setTranscriptionJob(req.data.jobs.transcription)
      let room = `conversation/${conversationId}`
      await Conversations.requestConversation(conversationId, userToken)
      io.to(room).emit("jobs_transcription_update", { state })
    }
  }
}
