// src/components/Quiz.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { auth } from "../firebase";

const Quiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/quizzes/${id}`);
        setQuiz(response.data);
        setAnswers(new Array(response.data.questions.length).fill(null));
      } catch (error) {
        console.error("Error fetching quiz:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  const handleAnswerChange = (questionIndex, optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("Please log in to submit the quiz.");
        navigate("/login");
        return;
      }
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/quizzes/submit/${id}`, {
        userId: user.uid,
        answers,
      });
      setResults(response.data);
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to submit quiz. Please try again.");
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-300">Loading quiz...</div>;
  }

  if (!quiz) {
    return <div className="text-center py-12 text-gray-300">Quiz not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1E2A47] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-[#1E2A47] rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-semibold text-white mb-4">{quiz.title}</h1>
          <p className="text-gray-300 mb-6">{quiz.description}</p>

          {!submitted ? (
            <form>
              {quiz.questions.map((question, qIndex) => (
                <div key={qIndex} className="mb-6">
                  <h5 className="text-xl font-semibold text-white mb-3">
                    {qIndex + 1}. {question.questionText}
                  </h5>
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="mb-2">
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name={`question-${qIndex}`}
                          checked={answers[qIndex] === oIndex}
                          onChange={() => handleAnswerChange(qIndex, oIndex)}
                          className="form-radio h-5 w-5 text-[#3B82F6] focus:ring-[#3B82F6]"
                        />
                        <span className="text-gray-300">{option.text}</span>
                      </label>
                    </div>
                  ))}
                </div>
              ))}
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full bg-[#3B82F6] text-white py-2 px-4 rounded-md hover:bg-[#2563EB] transition duration-200"
              >
                Submit Quiz
              </button>
            </form>
          ) : (
            <div>
              <h3 className="text-2xl font-semibold text-white mb-4">Results</h3>
              <p className="text-gray-300 mb-6">
                Score: {results.score} / {results.totalQuestions} (
                <span className="text-blue-400">{results.percentage.toFixed(2)}%</span>)
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200 mb-6"
              >
                Back to Dashboard
              </button>

              <h4 className="text-xl font-semibold text-white mb-4">Review Your Answers</h4>
              <div className="space-y-4">
                {results.review.map((item, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-md ${
                      item.isCorrect ? "bg-green-900/20" : "bg-red-900/20"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-semibold text-white">{item.questionText}</span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          item.isCorrect ? "bg-green-600 text-white" : "bg-red-600 text-white"
                        }`}
                      >
                        {item.isCorrect ? "Correct" : "Incorrect"}
                      </span>
                    </div>
                    <p className="text-gray-300">
                      <strong>Your Answer:</strong> {item.userAnswer}
                    </p>
                    <p className="text-gray-300">
                      <strong>Correct Answer:</strong> {item.correctAnswer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;