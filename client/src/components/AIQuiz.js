// src/components/AIQuiz.js
import React, { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CheckCircle, XCircle } from "react-feather";

const AIQuiz = () => {
  const [preGeneratedQuizzes, setPreGeneratedQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showReview, setShowReview] = useState(false);

  const navigate = useNavigate();
  const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || "AIzaSyAngRjuP9kQs7cjLI40NQaHa2xfRl0-80s";

  const predefinedTopics = [
    { topic: "Psychology", questionCount: 10, difficulty: "Hard" },
    { topic: "CSS", questionCount: 10, difficulty: "Hard" }, // Fixed typo: "questiosnCount" to "questionCount"
    { topic: "JavaScript", questionCount: 10, difficulty: "Hard" },
    { topic: "React", questionCount: 10, difficulty: "Medium" },
    { topic: "Git & Github", questionCount: 10, difficulty: "Medium" },
    { topic: "MERN Stack Development", questionCount: 20, difficulty: "Medium" },
    { topic: "Python Basics", questionCount: 20, difficulty: "Medium" },
    { topic: "C and C++", questionCount: 20, difficulty: "Medium" },
    { topic: "Backend Development", questionCount: 20, difficulty: "Hard" },
  ];

  const generateQuiz = async (topic, questionCount, difficulty) => {
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Generate a ${difficulty.toLowerCase()} difficulty quiz about ${topic} with ${questionCount} multiple-choice questions. 
      Provide the response in the following strict JSON format:
      {
        "title": "${topic} Quiz",
        "description": "A ${difficulty.toLowerCase()} difficulty quiz on ${topic} with ${questionCount} questions.",
        "questions": [
          {
            "questionText": "Question text",
            "options": [
              {"text": "Option 1", "isCorrect": false},
              {"text": "Option 2", "isCorrect": true},
              {"text": "Option 3", "isCorrect": false},
              {"text": "Option 4", "isCorrect": false}
            ]
          }
        ]
      }
      Ensure: Exactly ${questionCount} questions, 4 options per question, one correct answer per question. Wrap JSON in \`\`\`json ... \`\`\`.`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      let jsonString = jsonMatch
        ? jsonMatch[1].trim()
        : response.slice(response.indexOf("{"), response.lastIndexOf("}") + 1).trim();

      const quizData = JSON.parse(jsonString);
      quizData.category = topic;
      quizData.difficulty = difficulty;
      quizData.timesTaken = 0;
      quizData.highestScore = 0;
      quizData.createdAt = new Date().toISOString();

      return quizData;
    } catch (err) {
      console.error(`Error generating quiz for ${topic}:`, err);
      return null;
    }
  };

  const fetchPreGeneratedQuizzes = async () => {
    setLoading(true);
    setError(null);
    const quizzes = await Promise.all(
      predefinedTopics.map(({ topic, questionCount, difficulty }) =>
        generateQuiz(topic, questionCount, difficulty)
      )
    );
    const validQuizzes = quizzes.filter((quiz) => quiz !== null);
    if (validQuizzes.length !== predefinedTopics.length) {
      setError("Some quizzes failed to load. Please try again.");
    }
    setPreGeneratedQuizzes(validQuizzes);
    setLoading(false);
  };

  const handleGenerateAIQuiz = () => {
    const user = auth.currentUser;
    if (user) {
      fetchPreGeneratedQuizzes();
    } else {
      toast.error("Please log in or sign up first to generate an AI Quiz!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
      });
      navigate("/login");
    }
  };

  const handleStartQuiz = (quiz) => {
    setCurrentQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizCompleted(false);
    setUserAnswers([]);
    setShowReview(false);
  };

  const handleAnswerSelect = (selectedOption) => {
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    setSelectedAnswer(selectedOption);

    const answerData = {
      questionText: currentQuestion.questionText,
      selectedAnswer: selectedOption,
      correctAnswer: currentQuestion.options.find((opt) => opt.isCorrect),
    };

    const existingAnswerIndex = userAnswers.findIndex(
      (ans) => ans.questionText === currentQuestion.questionText
    );

    if (existingAnswerIndex !== -1) {
      const updatedAnswers = [...userAnswers];
      updatedAnswers[existingAnswerIndex] = answerData;
      setUserAnswers(updatedAnswers);
    } else {
      setUserAnswers((prev) => [...prev, answerData]);
    }
  };

  const handleNextQuestion = () => {
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];

    if (selectedAnswer && selectedAnswer.isCorrect) {
      setScore((prevScore) => prevScore + 1);
    }

    if (currentQuestionIndex + 1 < currentQuiz.questions.length) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      setSelectedAnswer(null);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Please log in to save the quiz.");
        navigate("/login");
        return;
      }
      const quizToSave = {
        ...currentQuiz,
        creatorId: user.uid,
        timesTaken: 1,
        highestScore: Math.round((score / currentQuiz.questions.length) * 100),
      };

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/quizzes/create`, quizToSave);
      console.log('Quiz saved:', response.data);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving quiz:", error.response?.data || error.message);
      alert("Failed to save quiz. Please try again.");
    }
  };

  const handleRestartQuiz = () => {
    handleStartQuiz(currentQuiz);
  };

  const handleReviewAnswers = () => {
    setShowReview(true);
  };

  const renderQuizQuestion = () => {
    if (!currentQuiz) return null;
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];

    return (
      <div className="bg-[#1E2A47] rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Question {currentQuestionIndex + 1}
        </h2>
        <p className="text-lg text-gray-300 mb-4">{currentQuestion.questionText}</p>
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              disabled={selectedAnswer !== null}
              className={`w-full py-2 px-4 rounded-md text-left transition duration-200 ${
                selectedAnswer === option
                  ? option.isCorrect
                    ? "bg-green-600"
                    : "bg-red-600"
                  : "bg-gray-700 hover:bg-gray-600"
              } text-white`}
            >
              {option.text}
            </button>
          ))}
        </div>
        {selectedAnswer && (
          <button
            onClick={handleNextQuestion}
            className="mt-4 w-full bg-[#3B82F6] text-white py-2 px-4 rounded-md hover:bg-[#2563EB] transition duration-200"
          >
            {currentQuestionIndex + 1 === currentQuiz.questions.length
              ? "Finish Quiz"
              : "Next Question"}
          </button>
        )}
      </div>
    );
  };

  const renderQuizResult = () => {
    if (!quizCompleted) return null;
    const percentage = (score / currentQuiz.questions.length) * 100;

    return (
      <div className="bg-[#1E2A47] rounded-lg shadow-lg p-6 text-center">
        <h2 className="text-2xl font-semibold text-white mb-4">Quiz Completed!</h2>
        <div className="mb-4">
          <h3 className="text-xl text-gray-300">
            Your Score: {score} / {currentQuiz.questions.length}
          </h3>
          <h4 className="text-lg text-gray-300 mt-2">
            {percentage >= 70 ? "Great Job!" : "Keep Practicing!"}
          </h4>
          <p className="text-gray-300">Percentage: {percentage.toFixed(2)}%</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={handleRestartQuiz}
            className="bg-[#3B82F6] text-white py-2 px-4 rounded-md hover:bg-[#2563EB] transition duration-200"
          >
            Restart Quiz
          </button>
          <button
            onClick={handleReviewAnswers}
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200"
          >
            Review Answers
          </button>
          <button
            onClick={handleSubmitQuiz}
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition duration-200"
          >
            Save Quiz to Profile
          </button>
          <button
            onClick={() => setCurrentQuiz(null)}
            className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  };

  const renderAnswerReview = () => {
    if (!showReview) return null;

    return (
      <div className="bg-[#1E2A47] rounded-lg shadow-lg overflow-hidden">
        <div className="bg-[#3B82F6] text-white text-xl font-semibold py-3 px-4 flex justify-between items-center">
          <h4 className="m-0">Quiz Review</h4>
          <button
            onClick={() => {
              setShowReview(false);
              setCurrentQuiz(null);
            }}
            className="bg-gray-200 text-gray-800 py-1 px-3 rounded-md hover:bg-gray-300 transition duration-200"
          >
            Close
          </button>
        </div>
        <div className="p-6">
          {userAnswers.map((answer, index) => (
            <div
              key={index}
              className={`mb-4 p-4 rounded-md ${
                answer.selectedAnswer.isCorrect ? "bg-green-900/20" : "bg-red-900/20"
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <h5 className="text-lg font-semibold text-white">
                  Question {index + 1}
                </h5>
                {answer.selectedAnswer.isCorrect ? (
                  <CheckCircle color="green" />
                ) : (
                  <XCircle color="red" />
                )}
              </div>
              <p className="text-gray-300 mb-2">{answer.questionText}</p>
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <strong className="text-gray-300">Your Answer:</strong>
                  <div
                    className={`mt-1 w-full py-2 px-4 rounded-md ${
                      answer.selectedAnswer.isCorrect ? "bg-green-600" : "bg-red-600"
                    } text-white`}
                  >
                    {answer.selectedAnswer.text}
                  </div>
                </div>
                <div className="flex-1">
                  <strong className="text-gray-300">Correct Answer:</strong>
                  <div className="mt-1 w-full py-2 px-4 rounded-md bg-green-600 text-white">
                    {answer.correctAnswer.text}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-gray-800 text-center py-3">
          <h5 className="text-gray-300">
            Score: {userAnswers.filter((ans) => ans.selectedAnswer.isCorrect).length} /{" "}
            {userAnswers.length}
          </h5>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1E2A47] py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-center text-white mb-8">
        AI Generated Quizzes
      </h1>
      {!preGeneratedQuizzes.length && !loading && !currentQuiz && (
        <div className="text-center mb-8">
          <button
            onClick={handleGenerateAIQuiz}
            className="bg-[#3B82F6] text-white text-lg font-semibold px-6 py-3 rounded-md hover:bg-[#2563EB] transition duration-200"
          >
            Generate AI Quiz
          </button>
        </div>
      )}
      {loading && (
        <div className="text-center py-12">
          <svg
            className="animate-spin h-8 w-8 text-[#3B82F6] mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-2 text-gray-300">Loading quizzes...</p>
        </div>
      )}
      {error && (
        <div className="mt-6 max-w-lg mx-auto bg-red-900/50 text-red-200 p-4 rounded-md text-center">
          {error}
        </div>
      )}
      {!currentQuiz && !loading && preGeneratedQuizzes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {preGeneratedQuizzes.map((quiz, index) => (
            <div key={index} className="bg-[#1E2A47] rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-2">{quiz.title}</h2>
              <p className="text-gray-300 mb-4">{quiz.description}</p>
              <p className="text-gray-300">
                <strong>Questions:</strong> {quiz.questions.length}
                <br />
                <strong>Difficulty:</strong> {quiz.difficulty}
              </p>
              <button
                onClick={() => handleStartQuiz(quiz)}
                className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200"
              >
                Start Quiz
              </button>
            </div>
          ))}
        </div>
      )}
      {currentQuiz && !quizCompleted && (
        <div className="max-w-2xl mx-auto">{renderQuizQuestion()}</div>
      )}
      {quizCompleted && (
        <div className="max-w-2xl mx-auto">{renderQuizResult()}</div>
      )}
      {showReview && <div className="max-w-4xl mx-auto">{renderAnswerReview()}</div>}
    </div>
  );
};

export default AIQuiz;