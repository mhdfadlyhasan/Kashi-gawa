import React from 'react';

interface WelcomeModalProps {
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 p-4 overflow-y-auto flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
          aria-label="Close"
        >
          ×
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Kashi-gawa</h2>
          <p className="text-gray-500">Learn Japanese through song lyrics</p>
        </div>

        <div className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              1
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Search for a song</h3>
              <p className="text-sm text-gray-500">
                Use the search bar at the top to find a song by name or artist. Results are pulled from the LRCLIB database.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
              2
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Add a song</h3>
              <p className="text-sm text-gray-500">
                Click a search result to add it to your library. The lyrics will be automatically fetched and saved.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
              3
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">View & interact</h3>
              <p className="text-sm text-gray-500">
                Open the song from the sidebar to see color-coded, tokenized lyrics. Click any word to see its grammar breakdown, reading, and meaning.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-8 w-full py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};
