import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { StoreCurrency, StoreSettings } from '../../types'
import { friendlyError } from '../../utils/errors'
import { validateUrl } from '../../utils/validators'
import { getSettings, updateSettings } from '../../services/settings'
import {
  deleteFile,
  pathFromUrl,
  STORE_ASSETS_BUCKET,
  uploadFile,
} from '../../services/storage'
import {
  Alert,
  Button,
  Card,
  CardHeader,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Textarea,
} from '../../components/ui/primitives'
import { useToast } from '../../hooks/useToast'
import { AssetImageField } from '../../components/admin/AssetImageField'

type SettingsForm = {
  store_name: string
  description: string
  welcome_text: string
  whatsapp_number: string
  facebook_url: string
  instagram_url: string
  tiktok_url: string
  tiktok_pixel_id: string
  meta_pixel_id: string
  google_analytics_id: string
  primary_color: string
  secondary_color: string
  floating_whatsapp_enabled: boolean
  currency: StoreCurrency
  payment_instructions: string
  payment_account_name: string
  payment_bank_name: string
  payment_account_number: string
  payment_account_type: string
}

const EMPTY_FORM: SettingsForm = {
  store_name: 'Mi Tienda',
  description: '',
  welcome_text: '',
  whatsapp_number: '',
  facebook_url: '',
  instagram_url: '',
  tiktok_url: '',
  tiktok_pixel_id: '',
  meta_pixel_id: '',
  google_analytics_id: '',
  primary_color: '#4f46e5',
  secondary_color: '#ffffff',
  floating_whatsapp_enabled: true,
  currency: 'BOB',
  payment_instructions: '',
  payment_account_name: '',
  payment_bank_name: '',
  payment_account_number: '',
  payment_account_type: '',
}

function toForm(settings: StoreSettings): SettingsForm {
  return {
    store_name: settings.store_name,
    description: settings.description ?? '',
    welcome_text: settings.welcome_text ?? '',
    whatsapp_number: settings.whatsapp_number ?? '',
    facebook_url: settings.facebook_url ?? '',
    instagram_url: settings.instagram_url ?? '',
    tiktok_url: settings.tiktok_url ?? '',
    tiktok_pixel_id: settings.tiktok_pixel_id ?? '',
    meta_pixel_id: settings.meta_pixel_id ?? '',
    google_analytics_id: settings.google_analytics_id ?? '',
    primary_color: settings.primary_color,
    secondary_color: settings.secondary_color,
    floating_whatsapp_enabled: settings.floating_whatsapp_enabled,
    currency: settings.currency,
    payment_instructions: settings.payment_instructions ?? '',
    payment_account_name: settings.payment_account_name ?? '',
    payment_bank_name: settings.payment_bank_name ?? '',
    payment_account_number: settings.payment_account_number ?? '',
    payment_account_type: settings.payment_account_type ?? '',
  }
}

export function Settings() {
  const { toast } = useToast()
  const [form, setForm] = useState<SettingsForm>(EMPTY_FORM)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [socialUrl, setSocialUrl] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    let active = true
    getSettings()
      .then((settings) => {
        if (!active) return
        if (settings) {
          setForm(toForm(settings))
          setLogoUrl(settings.logo_url)
          setSocialUrl(settings.social_image_url)
          setQrUrl(settings.qr_payment_url)
        }
      })
      .catch((err) => {
        if (active) setError(friendlyError(err))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  function setField<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleUpload(
    kind: 'logo' | 'social' | 'qr',
    file: File,
    setUrl: (url: string | null) => void,
  ) {
    setUploading(kind)
    setError(null)
    try {
      const current = kind === 'logo' ? logoUrl : kind === 'social' ? socialUrl : qrUrl
      const { url, error: uploadError } = await uploadFile(
        STORE_ASSETS_BUCKET,
        `store-assets/${kind}`,
        file,
      )
      if (uploadError) throw new Error(uploadError)
      if (current) {
        const oldPath = pathFromUrl(STORE_ASSETS_BUCKET, current)
        if (oldPath) await deleteFile(STORE_ASSETS_BUCKET, oldPath)
      }
      setUrl(url)
      toast('success', 'Imagen subida correctamente.')
    } catch (err) {
      toast('error', `Error al subir la imagen: ${friendlyError(err)}`)
    } finally {
      setUploading(null)
    }
  }

  async function handleRemove(url: string | null, setUrl: (url: string | null) => void) {
    if (!url) return
    try {
      const oldPath = pathFromUrl(STORE_ASSETS_BUCKET, url)
      if (oldPath) await deleteFile(STORE_ASSETS_BUCKET, oldPath)
      setUrl(null)
      toast('success', 'Imagen eliminada.')
    } catch (err) {
      toast('error', `Error al eliminar la imagen: ${friendlyError(err)}`)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const fieldErrors: Record<string, string> = {}
    if (!form.store_name.trim()) fieldErrors.store_name = 'El nombre de la tienda es obligatorio.'
    if (form.facebook_url && !validateUrl(form.facebook_url)) fieldErrors.facebook_url = 'URL inválida.'
    if (form.instagram_url && !validateUrl(form.instagram_url)) fieldErrors.instagram_url = 'URL inválida.'
    if (form.tiktok_url && !validateUrl(form.tiktok_url)) fieldErrors.tiktok_url = 'URL inválida.'
    setFieldErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

    setSaving(true)
    try {
      await updateSettings({
        store_name: form.store_name.trim(),
        description: form.description.trim() || null,
        welcome_text: form.welcome_text.trim() || null,
        whatsapp_number: form.whatsapp_number.trim() || null,
        facebook_url: form.facebook_url.trim() || null,
        instagram_url: form.instagram_url.trim() || null,
        tiktok_url: form.tiktok_url.trim() || null,
        tiktok_pixel_id: form.tiktok_pixel_id.trim() || null,
        meta_pixel_id: form.meta_pixel_id.trim() || null,
        google_analytics_id: form.google_analytics_id.trim() || null,
        primary_color: form.primary_color,
        secondary_color: form.secondary_color,
        floating_whatsapp_enabled: form.floating_whatsapp_enabled,
        currency: form.currency,
        logo_url: logoUrl,
        social_image_url: socialUrl,
        qr_payment_url: qrUrl,
        payment_instructions: form.payment_instructions.trim() || null,
        payment_account_name: form.payment_account_name.trim() || null,
        payment_bank_name: form.payment_bank_name.trim() || null,
        payment_account_number: form.payment_account_number.trim() || null,
        payment_account_type: form.payment_account_type.trim() || null,
      })
      toast('success', 'Configuración guardada correctamente.')
    } catch (err) {
      toast('error', `Error al guardar la configuración: ${friendlyError(err)}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Skeleton className="h-96" />
  }

  return (
    <div>
      <PageHeader title="Configuración" description="Configura los datos generales de tu tienda." />

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Información de la tienda" />
            <div className="space-y-4 p-5">
              <Input
                label="Nombre de la tienda"
                value={form.store_name}
                error={fieldErrors.store_name}
                onChange={(e) => setField('store_name', e.target.value)}
              />
              <Textarea
                label="Descripción"
                rows={3}
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
              />
              <Textarea
                label="Texto de bienvenida"
                rows={2}
                value={form.welcome_text}
                onChange={(e) => setField('welcome_text', e.target.value)}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Imágenes" />
            <div className="space-y-5 p-5">
              <AssetImageField
                label="Logo"
                url={logoUrl}
                uploading={uploading === 'logo'}
                onUpload={(file) => handleUpload('logo', file, setLogoUrl)}
                onRemove={() => handleRemove(logoUrl, setLogoUrl)}
              />
              <AssetImageField
                label="Imagen para compartir"
                url={socialUrl}
                uploading={uploading === 'social'}
                hint="Se usa al compartir la tienda en redes sociales."
                onUpload={(file) => handleUpload('social', file, setSocialUrl)}
                onRemove={() => handleRemove(socialUrl, setSocialUrl)}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Contacto y redes sociales" />
            <div className="space-y-4 p-5">
              <Input
                label="WhatsApp (número)"
                placeholder="Ej. +591 70000000"
                value={form.whatsapp_number}
                onChange={(e) => setField('whatsapp_number', e.target.value)}
              />
              <Input
                label="Facebook"
                placeholder="https://facebook.com/tutienda"
                value={form.facebook_url}
                error={fieldErrors.facebook_url}
                onChange={(e) => setField('facebook_url', e.target.value)}
              />
              <Input
                label="Instagram"
                placeholder="https://instagram.com/tutienda"
                value={form.instagram_url}
                error={fieldErrors.instagram_url}
                onChange={(e) => setField('instagram_url', e.target.value)}
              />
              <Input
                label="TikTok"
                placeholder="https://tiktok.com/@tutienda"
                value={form.tiktok_url}
                error={fieldErrors.tiktok_url}
                onChange={(e) => setField('tiktok_url', e.target.value)}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="TikTok Ads (Pixel)" />
            <div className="space-y-4 p-5">
              <Input
                label="TikTok Pixel ID"
                placeholder="Ej. CXXXXXXXXXXXXXXX..."
                value={form.tiktok_pixel_id}
                onChange={(e) => setField('tiktok_pixel_id', e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Si ingresas un Pixel ID, el Pixel de TikTok se cargará en la tienda
                pública y registrará PageView, ViewContent, AddToCart, InitiateCheckout
                y CompletePayment. Déjalo vacío para desactivar TikTok. El Pixel ID es
                un identificador público; el Access Token del Events API se maneja solo
                en backend y nunca se expone al navegador.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Meta Pixel (Facebook e Instagram Ads)" />
            <div className="space-y-4 p-5">
              <Input
                label="Meta Pixel ID"
                placeholder="Ej. 123456789012345"
                value={form.meta_pixel_id}
                onChange={(e) => setField('meta_pixel_id', e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Si ingresas un Pixel ID, el Pixel de Meta se cargará en la tienda
                pública y registrará PageView, ViewContent, AddToCart, InitiateCheckout
                y Purchase. Déjalo vacío para desactivar Meta. El Pixel ID es un
                identificador público; no se usa Access Token en el frontend.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Google Analytics 4" />
            <div className="space-y-4 p-5">
              <Input
                label="GA4 Measurement ID"
                placeholder="Ej. G-XXXXXXXXXX"
                value={form.google_analytics_id}
                onChange={(e) => setField('google_analytics_id', e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Si ingresas un Measurement ID, gtag.js se cargará en la tienda
                pública y registrará page_view, view_item, add_to_cart,
                begin_checkout y purchase. Déjalo vacío para desactivar GA4. El
                Measurement ID es público y se puede usar junto con Meta y TikTok.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Pago con QR" />
            <div className="space-y-4 p-5">
              <AssetImageField
                label="QR de pago"
                url={qrUrl}
                uploading={uploading === 'qr'}
                hint="Imagen del QR del banco o cuenta donde el cliente realizará el pago."
                onUpload={(file) => handleUpload('qr', file, setQrUrl)}
                onRemove={() => handleRemove(qrUrl, setQrUrl)}
              />
              <Textarea
                label="Instrucciones de pago"
                rows={3}
                placeholder="Ej. Realiza el pago con tu banco y envía el comprobante por WhatsApp."
                value={form.payment_instructions}
                onChange={(e) => setField('payment_instructions', e.target.value)}
              />
              <Input
                label="Titular de la cuenta"
                placeholder="Ej. María García"
                value={form.payment_account_name}
                onChange={(e) => setField('payment_account_name', e.target.value)}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="Banco / entidad"
                  placeholder="Ej. Banco Unión"
                  value={form.payment_bank_name}
                  onChange={(e) => setField('payment_bank_name', e.target.value)}
                />
                <Input
                  label="Número de cuenta"
                  placeholder="Ej. 1234567890"
                  value={form.payment_account_number}
                  onChange={(e) => setField('payment_account_number', e.target.value)}
                />
                <Input
                  label="Tipo de cuenta"
                  placeholder="Ej. Caja de ahorros"
                  value={form.payment_account_type}
                  onChange={(e) => setField('payment_account_type', e.target.value)}
                />
              </div>
              <p className="text-xs text-slate-500">
                Todos los campos son opcionales. El cliente los verá en el checkout después de
                crear su pedido. Si no subes un QR, se mostrará un aviso para contactarse por
                WhatsApp.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Apariencia y preferencias" />
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="primary-color" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Color principal
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="primary-color"
                      type="color"
                      value={form.primary_color}
                      onChange={(e) => setField('primary_color', e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border border-slate-300"
                    />
                    <span className="text-sm text-slate-600">{form.primary_color}</span>
                  </div>
                </div>
                <div>
                  <label htmlFor="secondary-color" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Color secundario
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="secondary-color"
                      type="color"
                      value={form.secondary_color}
                      onChange={(e) => setField('secondary_color', e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border border-slate-300"
                    />
                    <span className="text-sm text-slate-600">{form.secondary_color}</span>
                  </div>
                </div>
              </div>
              <Select
                label="Moneda"
                value={form.currency}
                onChange={(e) => setField('currency', e.target.value as StoreCurrency)}
              >
                <option value="BOB">BOB — Boliviano (Bs.)</option>
                <option value="USD">USD — Dólar ($)</option>
              </Select>
              <p className="text-xs text-slate-500">
                La moneda por defecto es BOB y se muestra como <strong>Bs.</strong>
              </p>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.floating_whatsapp_enabled}
                  onChange={(e) => setField('floating_whatsapp_enabled', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Mostrar botón flotante de WhatsApp
              </label>
            </div>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Guardar configuración
          </Button>
        </div>
      </form>
    </div>
  )
}