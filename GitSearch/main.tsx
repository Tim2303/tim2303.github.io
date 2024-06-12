import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

async function onLoad() {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  const root = createRoot(rootElement);
  root.render(
    <div>
      <GithubRepoSearch></GithubRepoSearch>
    </div>
  );
}

const GithubRepoSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [repos, setRepos] = useState([]);

  /* Input listener */
  const inputField = document.getElementById('input') as HTMLInputElement;
  if (inputField === null) return;

  inputField.oninput = () => {
    setSearchTerm(inputField.value);
  };
  inputField.onkeyup = async (e: any) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
      const response = await fetch(
        `https://api.github.com/search/repositories?q=${searchTerm}&sort=stars&order=desc`
      );
      const data = await response.json();
      setRepos(data.items);
    }
  };

  return (
    <div>
      <ul>
        {repos.map((repo: any) => (
          <li id="listEl">
            <strong>Score: {repo.stargazers_count}</strong>
            <p>
              {repo.name} : <a href={repo.html_url}>{repo.html_url}</a>
            </p>
            <p>Description : {repo.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GithubRepoSearch;

window.onload = onLoad;
