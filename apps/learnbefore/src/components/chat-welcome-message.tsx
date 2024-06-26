import { useTranslation } from "react-i18next"

export const ChatWelcomeMessage = () => {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-3xl font-semibold text-gray-800 mb-4">
        {t("Welcome to Learnbefore")}
      </h1>
      <p className="text-lg text-gray-500 mb-8">
        {t("Start discovering new words by typing in the input field below!")}
      </p>
    </div>
  )
}
