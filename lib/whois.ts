export interface WhoisResult {
  domainName: string
  registrar?: string
  creationDate?: string
  expiryDate?: string
  success: boolean
  error?: string
}

export async function fetchWhoisData(domain: string): Promise<WhoisResult> {
  const apiKey = process.env.WHOIS_API_KEY

  if (!apiKey) {
    return { domainName: domain, success: false, error: 'WHOIS API key not configured' }
  }

  try {
    // WhoisXML API
    const response = await fetch(
      `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${apiKey}&domainName=${encodeURIComponent(domain)}&outputFormat=JSON`,
      { next: { revalidate: 0 } }
    )

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`)
    }

    const data = await response.json()
    const record = data?.WhoisRecord

    if (!record) {
      return { domainName: domain, success: false, error: 'No WHOIS data found' }
    }

    return {
      domainName: domain,
      registrar: record.registrarName || record.registrar?.name,
      creationDate: record.createdDate ? new Date(record.createdDate).toISOString().split('T')[0] : undefined,
      expiryDate: record.expiresDate ? new Date(record.expiresDate).toISOString().split('T')[0] : undefined,
      success: true,
    }
  } catch (error) {
    return {
      domainName: domain,
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch WHOIS data',
    }
  }
}
