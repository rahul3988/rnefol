import { useState, useEffect, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, Save, RefreshCw, Eye, Settings, Palette, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../components/ToastProvider'
import { uploadFile } from '../utils/upload'
import { configService } from '../services/config'

interface HeroBannerSettings {
  animationType: 'fade' | 'slide' | 'zoom' | 'cube' | 'flip' | 'coverflow' | 'cards'
  transitionDuration: number // in milliseconds
  autoPlay: boolean
  autoPlayDelay: number // in milliseconds
  designStyle: 'modern' | 'classic' | 'minimal' | 'gradient' | 'dark' | 'colorful'
  showDots: boolean
  showArrows: boolean
  loop: boolean
}

interface HomepageSection {
  id: string
  name: string
  type: 'hero' | 'category' | 'banner' | 'gallery' | 'certification' | 'custom'
  images: string[]
  description: string
  sectionType: string // CMS section type
  imageCount: number // How many images this section can hold
  settings?: HeroBannerSettings // Only for hero banner
  isCustom?: boolean // Flag for custom sections
  orderIndex?: number // Display order
}

const API_BASE = configService.getApiConfig().baseUrl

export default function HomepageLayoutManager() {
  const { notify } = useToast()
  const [sections, setSections] = useState<HomepageSection[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedImage, setDraggedImage] = useState<{ file: File; sectionId: string } | null>(null)
  const [draggedOverSection, setDraggedOverSection] = useState<string | null>(null)
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [previewMode, setPreviewMode] = useState(false)
  const [showHeroSettings, setShowHeroSettings] = useState(false)
  const [showCreateSection, setShowCreateSection] = useState(false)
  const [newSection, setNewSection] = useState({
    name: '',
    description: '',
    sectionType: '',
    imageCount: 5,
    type: 'gallery' as const
  })
  const [heroSettings, setHeroSettings] = useState<HeroBannerSettings>({
    animationType: 'fade',
    transitionDuration: 1000,
    autoPlay: true,
    autoPlayDelay: 7000,
    designStyle: 'modern',
    showDots: true,
    showArrows: true,
    loop: true
  })

  // Initialize homepage sections based on actual Home.tsx structure
  const initializeSections = useCallback(async () => {
    const defaultSections: HomepageSection[] = [
      {
        id: 'hero_banner',
        name: 'Hero Banner (Top Slider)',
        type: 'hero',
        images: [],
        description: 'Main banner at the top - Rotating hero images and videos (up to 30)',
        sectionType: 'hero_banner',
        imageCount: 30,
        settings: {
          animationType: 'fade',
          transitionDuration: 1000,
          autoPlay: true,
          autoPlayDelay: 7000,
          designStyle: 'modern',
          showDots: true,
          showArrows: true,
          loop: true
        }
      },
      {
        id: 'body_category',
        name: 'Body Category',
        type: 'category',
        images: [],
        description: 'Body products category image',
        sectionType: 'shop_categories',
        imageCount: 1
      },
      {
        id: 'face_category',
        name: 'Face Category',
        type: 'category',
        images: [],
        description: 'Face products category image',
        sectionType: 'shop_categories',
        imageCount: 1
      },
      {
        id: 'hair_category',
        name: 'Hair Category',
        type: 'category',
        images: [],
        description: 'Hair products category image',
        sectionType: 'shop_categories',
        imageCount: 1
      },
      {
        id: 'combos_category',
        name: 'Combos Category',
        type: 'category',
        images: [],
        description: 'Combos products category image',
        sectionType: 'shop_categories',
        imageCount: 1
      },
      {
        id: 'commitments',
        name: 'Certifications/Commitments',
        type: 'certification',
        images: [],
        description: 'Certification badges (Cruelty-Free, Paraben-Free, etc.)',
        sectionType: 'commitments',
        imageCount: 10
      },
      {
        id: 'complete_kit',
        name: 'Complete Kit Banner',
        type: 'banner',
        images: [],
        description: 'Large banner for complete kit section',
        sectionType: 'complete_kit',
        imageCount: 1
      },
      {
        id: 'marketplace_logos',
        name: 'Marketplace Logos',
        type: 'gallery',
        images: [],
        description: 'Available on (Amazon, Flipkart, Meesho) logos',
        sectionType: 'marketplace_logos',
        imageCount: 10
      }
    ]

    // Load existing images from CMS
    try {
      const response = await fetch(`${API_BASE}/api/cms/sections/home`)
      const cmsSections = await response.json()

      // Find custom sections (those not in default list)
      const defaultSectionTypes = defaultSections.map(s => s.sectionType)
      const customCMSections = cmsSections.filter((s: any) => 
        !defaultSectionTypes.includes(s.section_type) && 
        s.section_type.startsWith('custom_')
      ).map((cmsSection: any) => ({
        id: cmsSection.section_type,
        name: cmsSection.title || cmsSection.section_type.replace('custom_', '').replace(/_/g, ' '),
        type: 'custom' as const,
        images: cmsSection.content?.images || cmsSection.content?.image ? [cmsSection.content.image] : [],
        description: cmsSection.content?.description || '',
        sectionType: cmsSection.section_type,
        imageCount: Array.isArray(cmsSection.content?.images) ? cmsSection.content.images.length : (cmsSection.content?.image ? 1 : 5),
        isCustom: true,
        orderIndex: cmsSection.order_index || 999
      }))

      // Map CMS sections to our sections
      const updatedSections = defaultSections.map(section => {
        const cmsSection = cmsSections.find((s: any) => s.section_type === section.sectionType)
        
        if (cmsSection && cmsSection.content) {
          if (section.sectionType === 'hero_banner' && cmsSection.content.images) {
            // Support both images and videos in hero banner
            const updatedSection = { 
              ...section, 
              images: Array.isArray(cmsSection.content.images) ? cmsSection.content.images : [],
              settings: cmsSection.content.settings || section.settings
            }
            // Update hero settings state if found
            if (cmsSection.content.settings) {
              setHeroSettings(cmsSection.content.settings)
            }
            return updatedSection
          }
          if (section.sectionType === 'shop_categories' && cmsSection.content.categories) {
            // Map categories
            const categoryMap: Record<string, string> = {
              'Body': 'body_category',
              'Face': 'face_category',
              'Hair': 'hair_category',
              'Combos': 'combos_category'
            }
            const cat = cmsSection.content.categories.find((c: any) => 
              categoryMap[c.name] === section.id
            )
            if (cat && cat.image) {
              return { ...section, images: [cat.image] }
            }
          }
          if (section.sectionType === 'commitments' && cmsSection.content.images) {
            return { ...section, images: cmsSection.content.images }
          }
          if (section.sectionType === 'complete_kit' && cmsSection.content.image) {
            return { ...section, images: [cmsSection.content.image] }
          }
          if (section.sectionType === 'marketplace_logos' && cmsSection.content.logos) {
            return { ...section, images: cmsSection.content.logos }
          }
        }
        return section
      })

      // Merge default and custom sections, sort by orderIndex
      const allSections = [...updatedSections, ...customCMSections].sort((a, b) => 
        (a.orderIndex || 0) - (b.orderIndex || 0)
      )

      setSections(allSections)
    } catch (error) {
      console.error('Failed to load sections:', error)
      setSections(defaultSections)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    initializeSections()
  }, [initializeSections])

  // Check if file is video
  const isVideoFile = (file: File): boolean => {
    return file.type.startsWith('video/') || /\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(file.name)
  }

  // Handle file upload
  const handleUpload = async (file: File, sectionId: string, imageIndex?: number) => {
    try {
      setUploading(prev => ({ ...prev, [sectionId]: true }))
      
      const url = await uploadFile(file, API_BASE)
      
      // Calculate new images array
      const section = sections.find(s => s.id === sectionId)
      if (!section) return
      
      const newImages = [...section.images]
      if (imageIndex !== undefined && imageIndex < newImages.length) {
        newImages[imageIndex] = url
      } else {
        newImages.push(url)
      }
      const finalImages = newImages.slice(0, section.imageCount)
      
      // Update local state
      setSections(prev => prev.map(s => 
        s.id === sectionId ? { ...s, images: finalImages } : s
      ))
      
      // Save to CMS with the new images
      await saveSectionToCMS(sectionId, url, imageIndex, finalImages)
      
      notify('success', 'Image uploaded successfully')
    } catch (error) {
      console.error('Upload failed:', error)
      notify('error', 'Failed to upload image')
    } finally {
      setUploading(prev => ({ ...prev, [sectionId]: false }))
    }
  }

  // Save section to CMS
  const saveSectionToCMS = async (sectionId: string, imageUrl: string, imageIndex: number | undefined, updatedImages?: string[]) => {
    const section = sections.find(s => s.id === sectionId)
    if (!section) return

    try {
      // Use provided images or get from section
      const imagesToUse = updatedImages || section.images
      
      let content: any = {}
      
      if (section.sectionType === 'hero_banner') {
        const heroSection = sections.find(s => s.id === 'hero_banner')
        content = {
          title: 'Hero Banner',
          subtitle: 'NATURAL BEAUTY',
          description: 'infused with premium natural ingredients',
          buttonText: 'SHOP NOW',
          buttonLink: '/shop',
          images: imagesToUse, // Can contain both image and video URLs
          videos: imagesToUse.filter((url: string) => /\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(url)),
          settings: heroSection?.settings || heroSettings
        }
      } else if (section.sectionType === 'shop_categories') {
        // Need to fetch existing categories and update the specific one
        const cmsResponse = await fetch(`${API_BASE}/api/cms/sections/home`)
        const cmsSections = await cmsResponse.json()
        const categorySection = cmsSections.find((s: any) => s.section_type === 'shop_categories')
        
        const categoryNameMap: Record<string, string> = {
          'body_category': 'Body',
          'face_category': 'Face',
          'hair_category': 'Hair',
          'combos_category': 'Combos'
        }
        
        const categoryName = categoryNameMap[sectionId]
        
        if (categorySection && categorySection.content && categorySection.content.categories) {
          const categories = categorySection.content.categories.map((cat: any) => 
            cat.name === categoryName ? { ...cat, image: imageUrl } : cat
          )
          content = {
            ...categorySection.content,
            categories
          }
        } else {
          const categoryMap: Record<string, string> = {
            'Body': '/body',
            'Face': '/face',
            'Hair': '/hair',
            'Combos': '/combos'
          }
          content = {
            title: 'SHOP BY CATEGORY',
            categories: [
              { name: 'Body', image: sectionId === 'body_category' ? imageUrl : '/IMAGES/body.jpg', link: categoryMap['Body'] },
              { name: 'Face', image: sectionId === 'face_category' ? imageUrl : '/IMAGES/face.jpg', link: categoryMap['Face'] },
              { name: 'Hair', image: sectionId === 'hair_category' ? imageUrl : '/IMAGES/hair.jpg', link: categoryMap['Hair'] },
              { name: 'Combos', image: sectionId === 'combos_category' ? imageUrl : '/IMAGES/combo.jpg', link: categoryMap['Combos'] }
            ]
          }
        }
      } else if (section.sectionType === 'commitments') {
        content = {
          title: 'THOUGHTFUL COMMITMENTS',
          description: 'We are committed to providing you with the safest and most effective natural skincare products.',
          images: imagesToUse
        }
      } else if (section.sectionType === 'complete_kit') {
        content = {
          title: 'THE COMPLETE KIT',
          description: 'Get the full Nefol experience in one curated bundle',
          buttonText: 'View Kit',
          buttonLink: '/combos',
          image: imageUrl
        }
      } else if (section.sectionType === 'marketplace_logos') {
        content = {
          title: 'AVAILABLE ON',
          logos: imagesToUse
        }
      } else if (section.sectionType.startsWith('custom_')) {
        // Custom section
        content = {
          title: section.name,
          description: section.description,
          images: imagesToUse
        }
      }

      const response = await fetch(`${API_BASE}/api/cms/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_slug: 'home',
          section_type: section.sectionType,
          title: section.name,
          content,
          order_index: 0,
          is_active: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save to CMS')
      }
    } catch (error) {
      console.error('Failed to save section:', error)
      throw error
    }
  }

  // Save hero banner settings
  const saveHeroSettings = async () => {
    const heroSection = sections.find(s => s.id === 'hero_banner')
    if (!heroSection) return

    // Update local state
    setSections(prev => prev.map(s => 
      s.id === 'hero_banner' ? { ...s, settings: heroSettings } : s
    ))

    // Save to CMS
    try {
      await saveSectionToCMS('hero_banner', heroSection.images[0] || '', undefined, heroSection.images)
      notify('success', 'Hero settings saved successfully')
      setShowHeroSettings(false)
    } catch (error) {
      notify('error', 'Failed to save hero settings')
    }
  }

  // Remove image
  const removeImage = async (sectionId: string, imageIndex: number) => {
    const section = sections.find(s => s.id === sectionId)
    if (!section) return

    const newImages = section.images.filter((_, i) => i !== imageIndex)
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, images: newImages } : s
    ))

    // Update CMS
    try {
      await saveSectionToCMS(sectionId, newImages[0] || '', undefined, newImages)
      notify('success', 'Image removed')
    } catch (error) {
      notify('error', 'Failed to update CMS')
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggedOverSection(sectionId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggedOverSection(null)
  }

  const handleDrop = async (e: React.DragEvent, sectionId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggedOverSection(null)

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/') || 
      /\.(mp4|webm|ogg|mov|avi|jpg|jpeg|png|gif|webp)(\?|$)/i.test(file.name)
    )

    if (files.length === 0) {
      notify('error', 'Please drop image or video files only')
      return
    }

    for (const file of files) {
      await handleUpload(file, sectionId)
    }
  }

  // Handle file input
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, sectionId: string) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => handleUpload(file, sectionId))
    e.target.value = '' // Reset input
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading homepage layout...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Homepage Layout Manager</h1>
          <p className="text-gray-600 mt-2">
            Drag and drop images to different sections or click to upload
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateSection(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create New Section
          </button>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Eye className="w-5 h-5" />
            {previewMode ? 'Edit Mode' : 'Preview Mode'}
          </button>
          <button
            onClick={initializeSections}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Blueprint View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section) => (
          <div
            key={section.id}
            onDragOver={(e) => handleDragOver(e, section.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, section.id)}
            className={`border-2 rounded-lg p-6 transition-all ${
              draggedOverSection === section.id
                ? 'border-blue-500 bg-blue-50 border-dashed'
                : 'border-gray-200 hover:border-gray-300'
            } ${uploading[section.id] ? 'opacity-50' : ''}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">
                    {section.name}
                    {section.isCustom && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                        Custom
                      </span>
                    )}
                  </h3>
                  {section.id === 'hero_banner' && (
                    <button
                      onClick={() => setShowHeroSettings(!showHeroSettings)}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title="Animation & Design Settings"
                    >
                      <Settings className="w-4 h-4 text-blue-600" />
                    </button>
                  )}
                  {section.isCustom && (
                    <button
                      onClick={async () => {
                        if (confirm(`Are you sure you want to delete "${section.name}"?`)) {
                          try {
                            const response = await fetch(`${API_BASE}/api/cms/sections/home`)
                            const cmsSections = await response.json()
                            const cmsSection = cmsSections.find((s: any) => s.section_type === section.sectionType)
                            
                            if (cmsSection) {
                              const deleteResponse = await fetch(`${API_BASE}/api/cms/sections/${cmsSection.id}`, {
                                method: 'DELETE'
                              })
                              
                              if (deleteResponse.ok) {
                                notify('success', 'Section deleted successfully')
                                await initializeSections()
                              } else {
                                throw new Error('Failed to delete')
                              }
                            }
                          } catch (error) {
                            console.error('Failed to delete section:', error)
                            notify('error', 'Failed to delete section')
                          }
                        }
                      }}
                      className="p-1.5 hover:bg-red-100 rounded transition-colors"
                      title="Delete Section"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-600">{section.description}</p>
                <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 rounded">
                  Max {section.imageCount} image{section.imageCount > 1 ? 's' : ''}
                </span>
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept={section.id === 'hero_banner' ? "image/*,video/*" : "image/*"}
                  multiple={section.imageCount > 1}
                  onChange={(e) => handleFileInput(e, section.id)}
                  className="hidden"
                  disabled={uploading[section.id]}
                />
                <div className="p-2 hover:bg-gray-100 rounded transition-colors">
                  <Upload className="w-5 h-5 text-gray-600" />
                </div>
              </label>
            </div>

            {/* Hero Banner Settings Panel */}
            {section.id === 'hero_banner' && showHeroSettings && (
              <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Animation & Design Settings</h4>
                  </div>
                  <button
                    onClick={() => setShowHeroSettings(false)}
                    className="p-1 hover:bg-blue-200 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Animation Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Animation Type
                    </label>
                    <select
                      value={heroSettings.animationType}
                      onChange={(e) => setHeroSettings({ ...heroSettings, animationType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="fade">Fade</option>
                      <option value="slide">Slide</option>
                      <option value="zoom">Zoom</option>
                      <option value="cube">Cube 3D</option>
                      <option value="flip">Flip</option>
                      <option value="coverflow">Coverflow</option>
                      <option value="cards">Cards</option>
                    </select>
                  </div>

                  {/* Design Style */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Design Style
                    </label>
                    <select
                      value={heroSettings.designStyle}
                      onChange={(e) => setHeroSettings({ ...heroSettings, designStyle: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="modern">Modern</option>
                      <option value="classic">Classic</option>
                      <option value="minimal">Minimal</option>
                      <option value="gradient">Gradient</option>
                      <option value="dark">Dark Theme</option>
                      <option value="colorful">Colorful</option>
                    </select>
                  </div>

                  {/* Transition Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transition Duration: {heroSettings.transitionDuration}ms
                    </label>
                    <input
                      type="range"
                      min="300"
                      max="3000"
                      step="100"
                      value={heroSettings.transitionDuration}
                      onChange={(e) => setHeroSettings({ ...heroSettings, transitionDuration: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Fast (300ms)</span>
                      <span>Slow (3000ms)</span>
                    </div>
                  </div>

                  {/* Auto-play Delay */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auto-play Delay: {heroSettings.autoPlayDelay / 1000}s
                    </label>
                    <input
                      type="range"
                      min="2000"
                      max="15000"
                      step="500"
                      value={heroSettings.autoPlayDelay}
                      onChange={(e) => setHeroSettings({ ...heroSettings, autoPlayDelay: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>2s</span>
                      <span>15s</span>
                    </div>
                  </div>

                  {/* Toggle Options */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={heroSettings.autoPlay}
                        onChange={(e) => setHeroSettings({ ...heroSettings, autoPlay: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Auto-play</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={heroSettings.showDots}
                        onChange={(e) => setHeroSettings({ ...heroSettings, showDots: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Show Navigation Dots</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={heroSettings.showArrows}
                        onChange={(e) => setHeroSettings({ ...heroSettings, showArrows: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Show Arrow Buttons</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={heroSettings.loop}
                        onChange={(e) => setHeroSettings({ ...heroSettings, loop: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Loop Slides</span>
                    </label>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      const heroSection = sections.find(s => s.id === 'hero_banner')
                      if (heroSection?.settings) {
                        setHeroSettings(heroSection.settings)
                      }
                      setShowHeroSettings(false)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveHeroSettings}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Settings
                  </button>
                </div>
              </div>
            )}

            {/* Drop Zone */}
            {section.images.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop {section.id === 'hero_banner' ? 'images or videos' : 'images'} here
                </p>
                <p className="text-xs text-gray-500">
                  or click the upload button above
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {section.images.map((mediaUrl, index) => {
                  const isVideo = /\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(mediaUrl) || mediaUrl.includes('/uploads/') && /\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(mediaUrl)
                  
                  return (
                    <div key={index} className="relative group">
                      {isVideo ? (
                        <video
                          src={mediaUrl}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          controls={false}
                          muted
                          playsInline
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <img
                          src={mediaUrl}
                          alt={`${section.name} ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                      )}
                      
                      {/* Video indicator badge */}
                      {isVideo && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded">
                          Video
                        </div>
                      )}
                      
                      {!previewMode && (
                        <>
                          <button
                            onClick={() => removeImage(section.id, index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <label className="absolute bottom-2 left-2 cursor-pointer">
                            <input
                              type="file"
                              accept={section.id === 'hero_banner' ? "image/*,video/*" : "image/*"}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleUpload(file, section.id, index)
                              }}
                              className="hidden"
                            />
                            <div className="p-1 bg-blue-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <Upload className="w-3 h-3" />
                            </div>
                          </label>
                        </>
                      )}
                    </div>
                  )
                })}
                
                {section.images.length < section.imageCount && !previewMode && (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept={section.id === 'hero_banner' ? "image/*,video/*" : "image/*"}
                      multiple={section.id === 'hero_banner'}
                      onChange={(e) => handleFileInput(e, section.id)}
                      className="hidden"
                    />
                    <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                  </label>
                )}
              </div>
            )}

            {uploading[section.id] && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-blue-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Uploading...</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>Drag images or videos (Hero Banner only) from your computer directly onto any section</li>
          <li>Or click the upload icon to browse and select files</li>
          <li>Hero Banner supports up to 30 images and videos</li>
          <li>Click "Create New Section" to add custom sections to your homepage</li>
          <li>Hover over media to replace or remove them</li>
          <li>Changes are saved automatically to the CMS</li>
          <li>Use Preview Mode to see how it looks without edit controls</li>
        </ul>
      </div>

      {/* Create Section Modal */}
      {showCreateSection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Create New Section</h2>
              <button
                onClick={() => {
                  setShowCreateSection(false)
                  setNewSection({ name: '', description: '', sectionType: '', imageCount: 5, type: 'gallery' })
                }}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Name *
                </label>
                <input
                  type="text"
                  value={newSection.name}
                  onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Featured Products, Special Offers"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newSection.description}
                  onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Brief description of this section"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Type (Unique ID) *
                </label>
                <input
                  type="text"
                  value={newSection.sectionType}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
                    setNewSection({ ...newSection, sectionType: `custom_${value}` })
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="featured-products (will become: custom_featured_products)"
                />
                <p className="text-xs text-gray-500 mt-1">Only lowercase letters, numbers, and underscores</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Images/Videos
                </label>
                <input
                  type="number"
                  value={newSection.imageCount}
                  onChange={(e) => setNewSection({ ...newSection, imageCount: parseInt(e.target.value) || 5 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="50"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => {
                    setShowCreateSection(false)
                    setNewSection({ name: '', description: '', sectionType: '', imageCount: 5, type: 'gallery' })
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!newSection.name || !newSection.sectionType) {
                      notify('error', 'Please fill in all required fields')
                      return
                    }

                    try {
                      // Create section in CMS
                      const response = await fetch(`${API_BASE}/api/cms/sections`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          page_slug: 'home',
                          section_type: newSection.sectionType || `custom_${newSection.name.toLowerCase().replace(/\s+/g, '_')}`,
                          title: newSection.name,
                          content: {
                            title: newSection.name,
                            description: newSection.description,
                            images: []
                          },
                          order_index: sections.length,
                          is_active: true
                        })
                      })

                      if (response.ok) {
                        notify('success', 'Section created successfully')
                        setShowCreateSection(false)
                        setNewSection({ name: '', description: '', sectionType: '', imageCount: 5, type: 'gallery' })
                        await initializeSections()
                      } else {
                        throw new Error('Failed to create section')
                      }
                    } catch (error) {
                      console.error('Failed to create section:', error)
                      notify('error', 'Failed to create section')
                    }
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Create Section
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

