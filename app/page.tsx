"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import html2canvas from "html2canvas"
import { motion, AnimatePresence } from "framer-motion"
import {
  Share2,
  Download,
  Copy,
  Upload,
  Dice5Icon,
  Sparkles,
  Palette,
  Type,
  ImageIcon,
  Wand2,
  Loader2,
} from "lucide-react"
import CustomDraggableText from "@/components/custom-draggable-text"

// Define vibe types and their corresponding colors
const vibes = [
  { name: "joy", emoji: "😂", color: "border-yellow-400" },
  { name: "angry", emoji: "😡", color: "border-red-500" },
  { name: "sad", emoji: "😢", color: "border-blue-400" },
  { name: "confused", emoji: "😵", color: "border-gray-400" },
  { name: "sarcastic", emoji: "😏", color: "border-purple-500" },
]

// Random text options for "Feeling Lucky"
const randomTopTexts = [
  "When you finally",
  "That moment when",
  "Nobody:",
  "Me explaining to my mom",
  "My face when",
  "How I look when",
  "My brain at 3am",
  "When someone says",
  "Me pretending to",
  "The teacher when",
  "When you open the fridge for the 10th time",
  "When autocorrect ruins your life",
  "When you realize it's Monday again",
  "When you laugh at your own joke",
  "When you send a risky text",
  "When you remember that one embarrassing moment",
  "When you try to act normal",
  "When you see your crush",
  "When you finish a series and don't know what to do",
  "When you hear someone say 'free food'",
]

const randomBottomTexts = [
  "and then it happened",
  "but it was all a dream",
  "and I took that personally",
  "mission accomplished",
  "what could go wrong?",
  "story of my life",
  "every single time",
  "and everybody clapped",
  "but I'm not complaining",
  "and that's a fact",
  "and instantly regretted it",
  "because why not?",
  "and my WiFi died",
  "and I just stood there",
  "and my brain said 'nope'",
  "and I pretended not to care",
  "and then I woke up",
  "and my pet judged me",
  "and I still don't get it",
  "and that's how legends are born",
]

// Font options
const fontOptions = [
  { name: "Impact", value: "Impact, sans-serif" },
  { name: "Comic Sans MS", value: "'Comic Sans MS', cursive" },
  { name: "Roboto", value: "Roboto, sans-serif" },
  { name: "Arial", value: "Arial, sans-serif" },
  { name: "Times New Roman", value: "'Times New Roman', serif" },
]

// Color options
const colorOptions = [
  { name: "White", value: "white" },
  { name: "Black", value: "black" },
  { name: "Yellow", value: "yellow" },
  { name: "Red", value: "red" },
  { name: "Blue", value: "blue" },
  { name: "Green", value: "green" },
  { name: "Purple", value: "purple" },
]

// AI prompt suggestions
const promptSuggestions = [
  "Make a funny meme about programming",
  "Create a meme about Monday mornings",
  "Make a meme about pizza being the best food",
  "Create a meme about social media addiction",
  "Make a meme about procrastination",
]

// OpenAI API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
console.log(OPENAI_API_KEY)

// Interface for Imgflip API response
interface ImgflipMeme {
  id: string
  name: string
  url: string
  width: number
  height: number
  box_count: number
}

interface ImgflipResponse {
  success: boolean
  data: {
    memes: ImgflipMeme[]
  }
}

// Function to fetch meme templates from Imgflip API
async function fetchMemeTemplates(): Promise<ImgflipMeme[]> {
  try {
    const response = await fetch("https://api.imgflip.com/get_memes")
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data: ImgflipResponse = await response.json()

    if (!data.success) {
      throw new Error("API returned unsuccessful response")
    }

    return data.data.memes
  } catch (error) {
    console.error("Error fetching meme templates:", error)
    throw error
  }
}

// Function to generate AI text using OpenAI API
async function generateMemeText(prompt: string, retryCount = 0): Promise<{ topText: string; bottomText: string }> {
  const maxRetries = 2
  const backoffDelay = retryCount > 0 ? retryCount * 1000 : 0 // Exponential backoff

  try {
    // Add delay for retries to respect rate limits
    if (backoffDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, backoffDelay))
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // Fallback to a less expensive model
        messages: [
          {
            role: "system",
            content:
              "You are a funny meme generator. Generate a top text and bottom text for a meme based on the user's prompt. Return ONLY a JSON object with 'topText' and 'bottomText' properties. Keep both texts short and punchy - under 50 characters each. Be creative and humorous.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 50,
      }),
    })

    // Handle rate limiting
    if (response.status === 429) {
      if (retryCount < maxRetries) {
        console.log(`Rate limited. Retrying in ${backoffDelay}ms...`)
        return generateMemeText(prompt, retryCount + 1)
      } else {
        // If we've exhausted retries, use fallback
        console.log("Rate limit exceeded after retries. Using fallback.")
        return generateFallbackText(prompt)
      }
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    // Parse the JSON from the response
    try {
      // Handle both cases: when the API returns JSON string or when it's already parsed
      const textData = typeof content === "string" ? JSON.parse(content) : content

      return {
        topText: textData.topText || "AI generated top text",
        bottomText: textData.bottomText || "AI generated bottom text",
      }
    } catch (e) {
      // If parsing fails, try to extract the text using regex
      const topMatch = content.match(/topText["']?\s*:\s*["']([^"']+)["']/i)
      const bottomMatch = content.match(/bottomText["']?\s*:\s*["']([^"']+)["']/i)

      return {
        topText: topMatch ? topMatch[1] : "AI generated top text",
        bottomText: bottomMatch ? bottomMatch[1] : "AI generated bottom text",
      }
    }
  } catch (error) {
    console.error("Error generating meme text:", error)

    // If we've exhausted retries or encountered a non-retryable error, use fallback
    if (retryCount >= maxRetries) {
      return generateFallbackText(prompt)
    }

    // For other errors, retry with backoff
    console.log(`Error occurred. Retrying in ${backoffDelay}ms...`)
    return generateMemeText(prompt, retryCount + 1)
  }
}

// Add this new function for fallback text generation
function generateFallbackText(prompt: string): { topText: string; bottomText: string } {
  console.log("Using fallback text generation")

  // Extract keywords from prompt
  const keywords = prompt
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3 && !["make", "create", "about", "meme", "funny"].includes(word))

  // Generate random texts based on prompt keywords or use defaults
  let topText = ""
  let bottomText = ""

  if (keywords.length > 0) {
    // Use keywords from the prompt to create somewhat relevant text
    const keyword = keywords[Math.floor(Math.random() * keywords.length)]

    // Pick a random template for top text
    const topTemplates = [
      `When you try to ${keyword}`,
      `That moment ${keyword} happens`,
      `Nobody: Me: *${keyword}*`,
      `${keyword.charAt(0).toUpperCase() + keyword.slice(1)} be like`,
      `When ${keyword} is life`,
    ]

    // Pick a random template for bottom text
    const bottomTemplates = [
      `and it fails spectacularly`,
      `but it's actually awesome`,
      `every single time`,
      `and everyone stares`,
      `mission accomplished`,
    ]

    topText = topTemplates[Math.floor(Math.random() * topTemplates.length)]
    bottomText = bottomTemplates[Math.floor(Math.random() * bottomTemplates.length)]
  } else {
    // If no relevant keywords, use random texts
    topText = randomTopTexts[Math.floor(Math.random() * randomTopTexts.length)]
    bottomText = randomBottomTexts[Math.floor(Math.random() * randomBottomTexts.length)]
  }

  return { topText, bottomText }
}

export default function Home() {
  const [topText, setTopText] = useState("")
  const [bottomText, setBottomText] = useState("")
  const [selectedVibe, setSelectedVibe] = useState(vibes[0])
  const [selectedTemplate, setSelectedTemplate] = useState<{ id: string; name: string; path: string } | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  // New state for text styling
  const [fontFamily, setFontFamily] = useState(fontOptions[0].value)
  const [fontSize, setFontSize] = useState(32)
  const [fontColor, setFontColor] = useState(colorOptions[0].value)
  const [textShadow, setTextShadow] = useState(true)

  // State for text positions
  const [topTextPosition, setTopTextPosition] = useState({ x: 0, y: 0 })
  const [bottomTextPosition, setBottomTextPosition] = useState({ x: 0, y: 0 })

  // State for AI text generation
  const [aiPrompt, setAiPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("editor")

  // State for API meme templates
  const [apiTemplates, setApiTemplates] = useState<ImgflipMeme[]>([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [templatePage, setTemplatePage] = useState(0)
  const templatesPerPage = 9

  const memeRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplatesFromApi()
  }, [])

  // Function to fetch templates from API
  const fetchTemplatesFromApi = async () => {
    setIsLoadingTemplates(true)
    setTemplateError(null)

    try {
      const templates = await fetchMemeTemplates()
      setApiTemplates(templates)

      // Select the first template from the API
      if (templates.length > 0 && !selectedTemplate) {
        handleApiTemplateSelect(templates[0])
      }

      toast({
        title: "Templates Loaded",
        description: `Loaded ${templates.length} popular meme templates!`,
      })
    } catch (error) {
      console.error("Failed to fetch templates:", error)
      setTemplateError("Failed to load templates. Please check your internet connection and try again.")

      toast({
        title: "Failed to Load Templates",
        description: "Please check your internet connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string)
        setSelectedTemplate(null)

        // Reset text positions when new image is uploaded
        setTopTextPosition({ x: 0, y: 0 })
        setBottomTextPosition({ x: 0, y: 0 })

        toast({
          title: "Image Uploaded",
          description: "Your image has been uploaded successfully.",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle API template selection
  const handleApiTemplateSelect = (template: ImgflipMeme) => {
    setSelectedTemplate({
      id: template.id,
      name: template.name,
      path: template.url,
    })
    setUploadedImage(null)

    // Reset text positions when new template is selected
    setTopTextPosition({ x: 0, y: 0 })
    setBottomTextPosition({ x: 0, y: 0 })
  }

  // Handle vibe selection
  const handleVibeSelect = (vibeName: string) => {
    const vibe = vibes.find((v) => v.name === vibeName)
    if (vibe) setSelectedVibe(vibe)
  }

  // "Feeling Lucky" function
  const feelingLucky = () => {
    // Pick random template from API templates
    if (apiTemplates.length > 0) {
      const randomApiTemplate = apiTemplates[Math.floor(Math.random() * apiTemplates.length)]
      handleApiTemplateSelect(randomApiTemplate)
    }

    // Pick random texts
    const randomTop = randomTopTexts[Math.floor(Math.random() * randomTopTexts.length)]
    const randomBottom = randomBottomTexts[Math.floor(Math.random() * randomBottomTexts.length)]
    setTopText(randomTop)
    setBottomText(randomBottom)

    // Pick random vibe
    const randomVibe = vibes[Math.floor(Math.random() * vibes.length)]
    setSelectedVibe(randomVibe)

    // Reset positions
    setTopTextPosition({ x: 0, y: 0 })
    setBottomTextPosition({ x: 0, y: 0 })

    toast({
      title: "Feeling Lucky!",
      description: "Generated a random meme for you.",
    })
  }

  // Generate AI text
  const generateAiText = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a prompt for the AI to generate text.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const result = await generateMemeText(aiPrompt)

      setTopText(result.topText)
      setBottomText(result.bottomText)

      // Switch to editor tab to show the result
      setActiveTab("editor")

      toast({
        title: "Text Generated",
        description: "Your meme text has been generated successfully.",
      })
    } catch (error) {
      console.error("Error in AI text generation:", error)
      toast({
        title: "Generation Failed",
        description: "We couldn't connect to the AI service. Using creative mode instead.",
        variant: "destructive",
      })

      // Use fallback even if the main function fails completely
      const fallbackResult = generateFallbackText(aiPrompt)
      setTopText(fallbackResult.topText)
      setBottomText(fallbackResult.bottomText)
      setActiveTab("editor")
    } finally {
      setIsGenerating(false)
    }
  }

  // Export meme as image
  const exportMeme = async () => {
    if (memeRef.current) {
      try {
        toast({
          title: "Exporting Meme",
          description: "Please wait while we prepare your meme...",
        })

        const canvas = await html2canvas(memeRef.current, {
          allowTaint: true,
          useCORS: true,
          scale: 2, // Higher quality
        })

        const dataUrl = canvas.toDataURL("image/png")
        const link = document.createElement("a")
        link.download = `memesnap-${Date.now()}.png`
        link.href = dataUrl
        link.click()

        toast({
          title: "Meme Exported!",
          description: "Your meme has been downloaded successfully.",
        })
      } catch (error) {
        console.error("Error exporting meme:", error)
        toast({
          title: "Export Failed",
          description: "There was an error exporting your meme.",
          variant: "destructive",
        })
      }
    }
  }

  // Copy meme to clipboard
  const copyMeme = async () => {
    if (memeRef.current) {
      try {
        toast({
          title: "Copying to Clipboard",
          description: "Please wait...",
        })

        const canvas = await html2canvas(memeRef.current, {
          allowTaint: true,
          useCORS: true,
          scale: 2, // Higher quality
        })

        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])

              toast({
                title: "Copied to Clipboard!",
                description: "Your meme has been copied to clipboard.",
              })
            } catch (err) {
              console.error("Clipboard API error:", err)
              // Fallback for browsers that don't support clipboard API
              const dataUrl = canvas.toDataURL("image/png")
              const link = document.createElement("a")
              link.download = `memesnap-${Date.now()}.png`
              link.href = dataUrl
              link.click()

              toast({
                title: "Clipboard Access Denied",
                description: "Your meme has been downloaded instead.",
              })
            }
          }
        })
      } catch (error) {
        console.error("Error copying meme:", error)
        toast({
          title: "Copy Failed",
          description: "There was an error copying your meme.",
          variant: "destructive",
        })
      }
    }
  }

  // Share meme on Twitter
  const shareOnTwitter = async () => {
    if (memeRef.current) {
      try {
        toast({
          title: "Preparing to Share",
          description: "Getting your meme ready for Twitter...",
        })

        const canvas = await html2canvas(memeRef.current, {
          allowTaint: true,
          useCORS: true,
          scale: 2,
        })

        const dataUrl = canvas.toDataURL("image/png")
        const text = "Check out this meme I made with MemeSnap! ✨"
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
        window.open(url, "_blank")

        toast({
          title: "Ready to Share!",
          description: "Upload the saved image to your tweet.",
        })
      } catch (error) {
        console.error("Error sharing meme:", error)
        toast({
          title: "Share Failed",
          description: "There was an error preparing your meme for sharing.",
          variant: "destructive",
        })
      }
    }
  }

  // Get text style based on current settings
  const getTextStyle = () => {
    return {
      fontFamily,
      fontSize: `${fontSize}px`,
      color: fontColor,
      textShadow: textShadow ? "0 2px 4px rgba(0,0,0,0.8)" : "none",
      textTransform: "uppercase" as const,
      fontWeight: "bold" as const,
    }
  }

  // Calculate pagination
  const totalPages = Math.ceil(apiTemplates.length / templatesPerPage)
  const paginatedTemplates = apiTemplates.slice(templatePage * templatesPerPage, (templatePage + 1) * templatesPerPage)

  // Handle page change
  const nextPage = () => {
    if (templatePage < totalPages - 1) {
      setTemplatePage(templatePage + 1)
    }
  }

  const prevPage = () => {
    if (templatePage > 0) {
      setTemplatePage(templatePage - 1)
    }
  }

  // Use a prompt suggestion
  const usePromptSuggestion = (suggestion: string) => {
    setAiPrompt(suggestion)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/50 pb-10">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
            EmergentMemes
          </h1>
          <p className="text-muted-foreground text-lg">Create vibe-coded memes in seconds ✨</p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Meme Editor</span>
              <span className="sm:hidden">Editor</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              <span className="hidden sm:inline">AI Generator</span>
              <span className="sm:hidden">AI</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left column: Controls */}
              <div className="space-y-6">
                <Card className="overflow-hidden border-2 border-muted transition-all hover:border-muted-foreground/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Image Source
                    </CardTitle>
                    <CardDescription>Choose a template or upload your own image</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <Tabs defaultValue="templates">
                      <TabsList className="grid grid-cols-2 mb-4">
                        <TabsTrigger value="templates">Popular Templates</TabsTrigger>
                        <TabsTrigger value="upload">Upload Image</TabsTrigger>
                      </TabsList>

                      <TabsContent value="templates" className="space-y-4">
                        {isLoadingTemplates ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                              <Skeleton key={index} className="aspect-square rounded-lg" />
                            ))}
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              <AnimatePresence>
                                {paginatedTemplates.map((template) => (
                                  <motion.div
                                    key={template.id}
                                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                                      selectedTemplate?.id === template.id && !uploadedImage
                                        ? "border-primary"
                                        : "border-transparent"
                                    }`}
                                    onClick={() => handleApiTemplateSelect(template)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.98 }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                  >
                                    <div className="aspect-square relative">
                                      <Image
                                        src={template.url || "/placeholder.svg"}
                                        alt={template.name}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 33vw"
                                        crossOrigin="anonymous"
                                      />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center truncate">
                                      {template.name}
                                    </div>
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </div>

                            {/* Pagination controls */}
                            {apiTemplates.length > templatesPerPage && (
                              <div className="flex items-center justify-between mt-4">
                                <Button variant="outline" size="sm" onClick={prevPage} disabled={templatePage === 0}>
                                  Previous
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                  Page {templatePage + 1} of {totalPages}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={nextPage}
                                  disabled={templatePage >= totalPages - 1}
                                >
                                  Next
                                </Button>
                              </div>
                            )}
                          </>
                        )}

                        {templateError && (
                          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                            {templateError}
                            <Button variant="outline" size="sm" onClick={fetchTemplatesFromApi} className="mt-2 w-full">
                              Try Again
                            </Button>
                          </div>
                        )}

                        {/* Feeling Lucky Button */}
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            onClick={feelingLucky}
                            variant="outline"
                            className="w-full mt-4 text-lg font-medium bg-gradient-to-r from-yellow-500/10 to-amber-500/10 hover:from-yellow-500/20 hover:to-amber-500/20 transition-all"
                            disabled={apiTemplates.length === 0}
                          >
                            <Dice5Icon className="mr-2 h-5 w-5" />🎲 Feeling Lucky
                          </Button>
                        </motion.div>
                      </TabsContent>

                      <TabsContent value="upload" className="space-y-4">
                        <motion.div
                          className="border-2 border-dashed rounded-lg p-6 text-center"
                          whileHover={{ borderColor: "rgba(var(--primary), 0.5)" }}
                          transition={{ duration: 0.2 }}
                        >
                          <Input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                          />
                          <Label
                            htmlFor="image-upload"
                            className="flex flex-col items-center justify-center cursor-pointer"
                          >
                            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                            <span className="text-lg font-medium">Upload your image</span>
                            <span className="text-sm text-muted-foreground mt-1">PNG, JPG up to 5MB</span>
                          </Label>
                        </motion.div>

                        {uploadedImage && (
                          <motion.div
                            className="mt-4 text-center"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <p className="text-sm text-green-600 mb-2">Image uploaded successfully!</p>
                            <Button variant="outline" size="sm" onClick={() => setUploadedImage(null)}>
                              Remove
                            </Button>
                          </motion.div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-2 border-muted transition-all hover:border-muted-foreground/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Type className="h-5 w-5" />
                      Text Content
                    </CardTitle>
                    <CardDescription>Add text to your meme</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="top-text">Top Text</Label>
                      <Input
                        id="top-text"
                        placeholder="Enter top text"
                        value={topText}
                        onChange={(e) => setTopText(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bottom-text">Bottom Text</Label>
                      <Input
                        id="bottom-text"
                        placeholder="Enter bottom text"
                        value={bottomText}
                        onChange={(e) => setBottomText(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vibe-selector">Select Vibe</Label>
                      <Select onValueChange={handleVibeSelect} defaultValue={selectedVibe.name}>
                        <SelectTrigger id="vibe-selector">
                          <SelectValue placeholder="Select a vibe" />
                        </SelectTrigger>
                        <SelectContent>
                          {vibes.map((vibe) => (
                            <SelectItem key={vibe.name} value={vibe.name}>
                              <span className="flex items-center">
                                <span className="mr-2">{vibe.emoji}</span>
                                <span className="capitalize">{vibe.name}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Text Style Customization Card */}
                <Card className="overflow-hidden border-2 border-muted transition-all hover:border-muted-foreground/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Text Style
                    </CardTitle>
                    <CardDescription>Customize the appearance of your text</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="font-family">Font</Label>
                      <Select onValueChange={setFontFamily} defaultValue={fontFamily}>
                        <SelectTrigger id="font-family">
                          <SelectValue placeholder="Select a font" />
                        </SelectTrigger>
                        <SelectContent>
                          {fontOptions.map((font) => (
                            <SelectItem key={font.name} value={font.value} style={{ fontFamily: font.value }}>
                              {font.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="font-size">Font Size: {fontSize}px</Label>
                      </div>
                      <Slider
                        id="font-size"
                        min={16}
                        max={64}
                        step={1}
                        value={[fontSize]}
                        onValueChange={(value) => setFontSize(value[0])}
                        className="py-4"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="font-color">Font Color</Label>
                      <Select onValueChange={setFontColor} defaultValue={fontColor}>
                        <SelectTrigger id="font-color">
                          <SelectValue placeholder="Select a color" />
                        </SelectTrigger>
                        <SelectContent>
                          {colorOptions.map((color) => (
                            <SelectItem key={color.name} value={color.value}>
                              <div className="flex items-center">
                                <div
                                  className="w-4 h-4 rounded-full mr-2"
                                  style={{
                                    backgroundColor: color.value,
                                    border: color.value === "white" ? "1px solid #ccc" : "none",
                                  }}
                                />
                                {color.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch id="text-shadow" checked={textShadow} onCheckedChange={setTextShadow} />
                      <Label htmlFor="text-shadow">Text Shadow/Outline</Label>
                    </div>

                    <div className="text-sm text-muted-foreground mt-2 p-2 bg-muted/50 rounded-md">
                      <p className="flex items-center">
                        <span className="mr-2">💡</span>
                        Tip: Drag text on the preview to reposition it anywhere!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right column: Preview and Export */}
              <div className="space-y-6">
                <Card className="overflow-hidden border-2 border-muted transition-all hover:border-muted-foreground/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-center">Meme Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <div
                      ref={memeRef}
                      className={`relative mx-auto max-w-md border-8 ${selectedVibe.color} rounded-lg overflow-hidden bg-black meme-container`}
                    >
                      {uploadedImage || selectedTemplate ? (
                        <div className="relative aspect-square">
                          <Image
                            src={uploadedImage || (selectedTemplate ? selectedTemplate.path : "/placeholder.svg")}
                            alt="Meme template"
                            fill
                            className="object-cover"
                            priority
                            crossOrigin="anonymous"
                          />

                          {topText && (
                            <CustomDraggableText
                              text={topText}
                              position={topTextPosition}
                              onPositionChange={setTopTextPosition}
                              style={getTextStyle()}
                              defaultPosition="top"
                            />
                          )}

                          {bottomText && (
                            <CustomDraggableText
                              text={bottomText}
                              position={bottomTextPosition}
                              onPositionChange={setBottomTextPosition}
                              style={getTextStyle()}
                              defaultPosition="bottom"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="aspect-square flex items-center justify-center bg-muted">
                          <p className="text-muted-foreground">Select a template or upload an image</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-2 border-muted transition-all hover:border-muted-foreground/20">
                  <CardHeader>
                    <CardTitle>Export & Share</CardTitle>
                    <CardDescription>Save or share your meme creation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button
                          onClick={exportMeme}
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </motion.div>

                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button
                          onClick={copyMeme}
                          variant="outline"
                          className="w-full flex items-center justify-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </Button>
                      </motion.div>

                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button
                          onClick={shareOnTwitter}
                          variant="outline"
                          className="w-full flex items-center justify-center gap-2"
                        >
                          <Share2 className="h-4 w-4" />
                          Share on Twitter
                        </Button>
                      </motion.div>

                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button
                          onClick={exportMeme}
                          variant="secondary"
                          className="w-full flex items-center justify-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Save as PNG
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <Card className="overflow-hidden border-2 border-muted transition-all hover:border-muted-foreground/20 max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  AI Meme Text Generator
                </CardTitle>
                <CardDescription>Let AI generate funny meme text based on your prompt</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="ai-prompt">What kind of meme do you want?</Label>
                  <Textarea
                    id="ai-prompt"
                    placeholder="E.g., Make a funny meme about programming"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Try these suggestions:</Label>
                  <div className="flex flex-wrap gap-2">
                    {promptSuggestions.map((suggestion, index) => (
                      <motion.div key={index} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button variant="outline" size="sm" onClick={() => setAiPrompt(suggestion)} className="text-xs">
                          {suggestion}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={generateAiText}
                      disabled={isGenerating || !aiPrompt.trim()}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          Generate Meme Text
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>

                <div className="mt-4 text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
                  <p className="flex items-center mb-2">
                    <span className="mr-2">ℹ️</span>
                    <span className="font-medium">Note:</span>
                  </p>
                  <p>
                    If the AI service is busy, we'll use our creative mode to generate meme text based on your prompt.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 flex flex-col items-start px-6 py-4">
                <h4 className="text-sm font-medium mb-2">How it works:</h4>
                <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
                  <li>Enter a prompt describing the meme you want</li>
                  <li>Click "Generate Meme Text" to create top and bottom text</li>
                  <li>The AI will generate funny text for your meme</li>
                  <li>You'll be taken to the editor to customize your meme</li>
                </ol>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </main>
  )
}
