import { NextRequest, NextResponse } from 'next/server'
// use this import for when database is enabled
//import prisma from '@/lib/prisma'

// GET endpoint - returns example data
export async function GET(request: NextRequest) {
  try {
    // You can access query parameters like this:
    const searchParams = request.nextUrl.searchParams
    const name = searchParams.get('name') || 'World'

    const data = {
      message: `Hello, ${name}!`,
      timestamp: new Date().toISOString(),
      method: 'GET',
      url: request.url
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// POST endpoint - accepts and processes data
export async function POST(request: NextRequest) {
  try {
    // Parse JSON body
    const body = await request.json()

    // Basic validation
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Process the data (in a real app, you might save to database, etc.)
    const responseData = {
      message: `Data received successfully!`,
      receivedData: body,
      processedAt: new Date().toISOString(),
      method: 'POST'
    }

    return NextResponse.json(responseData, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// PUT endpoint - for updating data
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    const responseData = {
      message: `Data updated successfully!`,
      updatedData: body,
      updatedAt: new Date().toISOString(),
      method: 'PUT'
    }

    return NextResponse.json(responseData, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

// DELETE endpoint - for deleting data
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID parameter is required' },
        { status: 400 }
      )
    }

    const responseData = {
      message: `Item with ID ${id} deleted successfully!`,
      deletedId: id,
      deletedAt: new Date().toISOString(),
      method: 'DELETE'
    }

    return NextResponse.json(responseData, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
