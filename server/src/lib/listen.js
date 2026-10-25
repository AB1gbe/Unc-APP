// Start the HTTP server, and say clearly when it can't (session 49).
// Express 5 passes a start-up error (e.g. the port is taken) to the listen
// callback instead of throwing, so without this the server printed
// "listening" and then quietly stopped.
export function listen(app, port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, (err) => {
      if (!err) return resolve(server);
      if (err.code === 'EADDRINUSE') {
        err.message = `Port ${port} is already in use: another Unc window (npm run live, npm run dev or npm start) is probably still running. `
          + 'Stop it there with Ctrl + C, or start this one on another port (set PORT=4001 first).';
      }
      reject(err);
    });
  });
}
