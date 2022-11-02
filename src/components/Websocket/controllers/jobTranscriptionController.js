import { getJobs } from "../request/index.js"

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
    console.log(req.data.jobs.transcription)

    setTimeout(
      () => fetchJob(conversation, conversationId, userToken, io),
      3000
    )

    if (state && state != "started") {
      conversation.setTranscriptionJob(req.data.jobs.transcription)
      let room = `conversation/${conversationId}`
      io.to(room).emit("jobs_transcription_update", { state })
    }
  }
}
