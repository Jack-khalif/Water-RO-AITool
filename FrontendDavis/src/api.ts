import axios from 'axios'

const API_BASE = 'http://localhost:8000' // adjust if backend runs elsewhere

export async function uploadLabReport(file: File, token?: string) {
  const formData = new FormData()
  formData.append('file', file)
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await axios.post(`${API_BASE}/upload-report`, formData, { headers })
  return response.data
}

export async function analyzeLabReport({ lab_report, user_requirements, image_path, token }: {
  lab_report?: string,
  user_requirements: Record<string, any>,
  image_path?: string,
  token?: string
}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await axios.post(`${API_BASE}/analyze`, {
    lab_report,
    user_requirements,
    image_path,
    generate_multiple_designs: true
  }, { headers })
  return response.data
}
