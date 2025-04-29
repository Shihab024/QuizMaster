// src/components/CreateQuiz.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const CreateQuiz = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: "", options: [{ text: "", isCorrect: false }] },
    ]);
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const addOption = (qIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push({ text: "", isCorrect: false });
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, field, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex][field] = value;
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      alert("Please log in to create a quiz!");
      navigate("/login");
      return;
    }

    try {
      const user = auth.currentUser;
      await axios.post(`${process.env.REACT_APP_API_URL}/api/quizzes/create`, {
        title,
        description,
        questions,
        creatorId: user.uid,
      });
      toast.success("Quiz created successfully. Go to Dashboard to Take this Quiz.", {
        onClose: () => navigate("/dashboard"),
      });
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast.error("Failed to create quiz. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1E2A47] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#1E2A47] rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-semibold text-white mb-6">Create New Quiz</h1>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                rows="4"
              />
            </div>

            {questions.map((question, qIndex) => (
              <div key={qIndex} className="bg-gray-800 rounded-lg p-4 mb-4">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Question {qIndex + 1}
                  </label>
                  <input
                    type="text"
                    value={question.questionText}
                    onChange={(e) => handleQuestionChange(qIndex, "questionText", e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                  />
                </div>
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center space-x-3 mb-3">
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => handleOptionChange(qIndex, oIndex, "text", e.target.value)}
                      placeholder={`Option ${oIndex + 1}`}
                      required
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    />
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={option.isCorrect}
                        onChange={(e) => handleOptionChange(qIndex, oIndex, "isCorrect", e.target.checked)}
                        className="form-checkbox h-5 w-5 text-[#3B82F6] focus:ring-[#3B82F6]"
                      />
                      <span className="text-gray-300">Correct Answer</span>
                    </label>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOption(qIndex)}
                  className="bg-gray-600 text-white py-1 px-3 rounded-md hover:bg-gray-700 transition duration-200"
                >
                  Add Option
                </button>
              </div>
            ))}

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={addQuestion}
                className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200"
              >
                Add Question
              </button>
              <button
                type="submit"
                className="bg-[#3B82F6] text-white py-2 px-4 rounded-md hover:bg-[#2563EB] transition duration-200"
              >
                Create Quiz
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateQuiz;