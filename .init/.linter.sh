#!/bin/bash
cd /home/kavia/workspace/code-generation/digital-flash-card-manager-88917-88968/flashcard_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

