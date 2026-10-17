import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const METADATA_PATH = path.join(process.cwd(), '../h2o-landing/public/images/metadata.json');

/**
 * GET /api/images
 * Retrieve all images or filtered by category
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit')) || null;

    // Read metadata
    if (!fs.existsSync(METADATA_PATH)) {
      return NextResponse.json(
        { error: 'Image metadata not found' },
        { status: 404 }
      );
    }

    const metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));
    let images = metadata.images || [];

    // Filter by category if specified
    if (category && category !== 'all') {
      images = images.filter(img => img.category === category);
    }

    // Apply limit if specified
    if (limit && limit > 0) {
      images = images.slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      total: images.length,
      categories: metadata.categories,
      images: images
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/images
 * Add new image metadata (for future uploads)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { filename, category, path: imagePath } = body;

    if (!filename || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: filename, category' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['hero', 'rooms', 'amenities', 'gallery'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Read current metadata
    const metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf-8'));

    // Add new image
    const newImage = {
      id: `${category}-${metadata.images.length + 1}`,
      filename,
      category,
      path: imagePath || `/images/${category}/${filename}`,
      dimensions: 'unknown',
      fileSize: 'unknown'
    };

    metadata.images.push(newImage);
    metadata.categories[category] = (metadata.categories[category] || 0) + 1;

    // Save updated metadata
    fs.writeFileSync(METADATA_PATH, JSON.stringify(metadata, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Image metadata added successfully',
      image: newImage
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding image:', error);
    return NextResponse.json(
      { error: 'Failed to add image', details: error.message },
      { status: 500 }
    );
  }
}
