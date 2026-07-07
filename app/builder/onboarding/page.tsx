"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { RoleGuard } from "@/components/role-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { API_BASE_URL } from "@/lib/backend-url"

export default function BuilderOnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Basic Profile
  const [name, setName] = useState("")
  const [blurb, setBlurb] = useState("")
  const [categories, setCategories] = useState<string[]>([])
  
  // Service configuration
  const [serviceType, setServiceType] = useState("Guided Learning")
  const [servicePrice, setServicePrice] = useState("100")
  const [serviceCategory, setServiceCategory] = useState("Science Fair")

  const handleCategoryChange = (cat: string) => {
    setCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = getSupabaseBrowser()
      const { data: { session } } = await supabase.auth.getSession()
      
      const email = session?.user?.email || "builder@demo.com"
      
      const res = await fetch("${API_BASE_URL}/builders/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          blurb,
          categories,
          service_type: serviceType,
          service_price: parseFloat(servicePrice),
          service_category: serviceCategory
        })
      })
      
      if (res.ok) {
        // Typically we'd show a success modal here, but we will redirect to dashboard
        router.push("/builder/dashboard")
      } else {
        const err = await res.json()
        alert(`Error: ${err.detail || 'Failed to submit onboarding'}`)
      }
    } catch (error) {
      console.error(error)
      alert("Failed to submit onboarding.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <RoleGuard allowedRoles={["builder"]}>
      <AppShell role="builder">
        <main className="min-h-screen px-4 py-8">
          <div className="mx-auto max-w-2xl grid gap-6">
            <h1 className="text-3xl font-bold">Builder Profile Setup</h1>
            <p className="text-muted-foreground">Complete your profile to get discovered by parents and students.</p>

            <form onSubmit={handleSubmit} className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>About You</CardTitle>
                  <CardDescription>How you'll appear in the Builder Directory</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Display Name / Studio Name</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. STEM Builders" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="blurb">Short Bio / Blurb</Label>
                    <Textarea 
                      id="blurb" 
                      value={blurb} 
                      onChange={e => setBlurb(e.target.value)} 
                      required 
                      placeholder="e.g. Museum-grade models with professional detailing." 
                      rows={3} 
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Specialties</Label>
                    <div className="flex gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <Checkbox id="cat-models" checked={categories.includes('models')} onCheckedChange={() => handleCategoryChange('models')} />
                        <Label htmlFor="cat-models" className="cursor-pointer">Models</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="cat-electronics" checked={categories.includes('electronics')} onCheckedChange={() => handleCategoryChange('electronics')} />
                        <Label htmlFor="cat-electronics" className="cursor-pointer">Electronics</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id="cat-craft" checked={categories.includes('craft')} onCheckedChange={() => handleCategoryChange('craft')} />
                        <Label htmlFor="cat-craft" className="cursor-pointer">Craft</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Base Service Offering</CardTitle>
                  <CardDescription>Setup your primary service tier.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Service Type</Label>
                    <Select value={serviceType} onValueChange={setServiceType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Guided Learning">Guided Learning (Co-build)</SelectItem>
                        <SelectItem value="Hybrid Learning">Hybrid (Some parts pre-built)</SelectItem>
                        <SelectItem value="Model Delivery">Full Model Delivery (Done for you)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="price">Base Price ($)</Label>
                    <Input id="price" type="number" value={servicePrice} onChange={e => setServicePrice(e.target.value)} required min="1" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Primary Subject / Category</Label>
                    <Select value={serviceCategory} onValueChange={setServiceCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Science Fair">Science Fair</SelectItem>
                        <SelectItem value="Robotics">Robotics</SelectItem>
                        <SelectItem value="Art Portfolio">Art Portfolio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" disabled={loading} size="lg">
                {loading ? "Submitting..." : "Submit for Verification"}
              </Button>
            </form>
          </div>
        </main>
      </AppShell>
    </RoleGuard>
  )
}
