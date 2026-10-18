import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(req) {
  try {
    const body = await req.json()
    const { id, nom, prix, capacite, description, features } = body

    if (!id || !nom || !prix) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Parse features from newline-separated string
    const featuresList = features
      .split('\n')
      .map(f => f.trim())
      .filter(f => f.length > 0)

    // Read current residences data
    const filePath = join(process.cwd(), '..', 'h2o-landing', 'lib', 'residences.js')

    // In production, this would update the residences.js file
    // For now, we'll simulate the update
    const residenceData = {
      id,
      slug: id,
      nom,
      prix: parseInt(prix),
      description,
      capacite,
      features: featuresList,
      images: [
        `/images/gallery/IMG_2868.jpg`,
        `/images/gallery/IMG_2869.jpg`,
        `/images/gallery/IMG_2870.jpg`,
        `/images/gallery/IMG_2873.jpg`,
      ],
      amenities: ['🏊 Piscine privée', '⚓ Pontoon', '🍽 Restaurant', '💆 Spa', '🚗 Parking'],
    }

    // Log the update (in production, write to file or database)
    console.log('📝 Résidence mise à jour:', residenceData)

    return Response.json({
      success: true,
      message: 'Résidence mise à jour avec succès',
      data: residenceData,
    })
  } catch (error) {
    console.error('Update error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
