import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const serviceId = formData.get('serviceId')

    if (!file || !serviceId) {
      return Response.json({ error: 'Missing file or serviceId' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save to public/uploads/services/[serviceId]/
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'services', serviceId)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const filename = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '-')}`
    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)

    const url = `/uploads/services/${serviceId}/${filename}`

    return Response.json({ success: true, url, filename })
  } catch (error) {
    console.error('Upload error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
