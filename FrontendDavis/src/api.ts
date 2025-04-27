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

