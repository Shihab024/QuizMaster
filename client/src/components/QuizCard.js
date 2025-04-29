// src/components/QuizCard.js
import { Link } from "react-router-dom";
import { formatDate } from "../utils/helpers";

const QuizCard = ({ quiz, onDelete }) => {
  return (
    <div className="bg-[#1E2A47] rounded-lg shadow-lg p-6 h-full">
      <h5 className="text-xl font-semibold text-white mb-2">{quiz.title}</h5>
      <p className="text-gray-300 mb-3">{quiz.description}</p>
      <div className="text-gray-300 text-sm mb-1">
        {quiz.questions.length} questions | Taken {quiz.timesTaken} times
      </div>
      {quiz.highestScore > 0 && (
        <div className="text-gray-300 text-sm mb-1">
          Highest Score: {quiz.highestScore.toFixed(0)}%
        </div>
      )}
      <div className="text-gray-300 text-sm mb-4">
        Created: {formatDate(quiz.createdAt)}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          to={`/take-quiz/${quiz._id}`}
          className="bg-[#3B82F6] text-white py-2 px-4 rounded-md hover:bg-[#2563EB] transition duration-200"
        >
          Take Quiz
        </Link>
        <Link
          to={`/edit-quiz/${quiz._id}`}
          className="bg-transparent border border-gray-300 text-gray-300 py-2 px-4 rounded-md hover:bg-gray-700 transition duration-200"
        >
          Edit
        </Link>
        {onDelete && (
          <button
            onClick={() => onDelete(quiz._id)}
            className="bg-transparent border border-red-500 text-red-500 py-2 px-4 rounded-md hover:bg-red-900/20 transition duration-200"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizCard;