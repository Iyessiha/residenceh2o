import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const eventId = formData.get('eventId')

    if (!file || !eventId) {
      return Response.json({ error: 'Missing file or eventId' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save to public/uploads/events/[eventId]/
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'events', eventId)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const filename = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '-')}`
    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)

    const url = `/uploads/events/${eventId}/${filename}`

    return Response.json({ success: true, url, filename })
  } catch (error) {
    console.error('Upload error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
