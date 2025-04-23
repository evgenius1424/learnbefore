import React, { useState } from "react"
import { Eye, EyeOff, BookOpen, Check, X } from "lucide-react"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card"
import { Button } from "@repo/ui/components/button"
import { Word } from "@repo/types/words.ts"

type WordCardProps = {
  word: Word
}

export const WordCard: React.FC<WordCardProps> = ({ word }) => {
  const [showMeaning, setShowMeaning] = useState(false)

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!(e.target as HTMLElement).closest("button")) {
      setShowMeaning(!showMeaning)
    }
  }
  return (
    <Card onClick={handleCardClick} className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">{word.word}</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMeaning(!showMeaning)}
            aria-label={showMeaning ? "Hide meaning" : "Show meaning"}
          >
            {showMeaning ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Ignore word">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      {showMeaning && (
        <CardContent>
          <p className="text-muted-foreground mb-1">{word.translation}</p>
          <p className="font-medium">{word.meaning}</p>
        </CardContent>
      )}
      <CardFooter className="flex justify-between">
        <Button variant="secondary" size="sm">
          <BookOpen className="mr-2 h-4 w-4" />
          Learn
        </Button>
        <Button variant="outline" size="sm">
          <Check className="mr-2 h-4 w-4" />
          Known word
        </Button>
      </CardFooter>
    </Card>
  )
}
