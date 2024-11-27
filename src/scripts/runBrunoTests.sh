# Display current env (must be provided as param of the script)
echo "TEST ENVIRONMENT: $1";

rootFolder=$(pwd);

# Default success status
status=0;

# Loop over all bruno collections
for folder in `ls ${rootFolder}/src/tests/bruno`;
do
  echo -e "\n\nRUNNING COLLECTION: $folder" &&

  # Enter the collection's folder
  cd $rootFolder/src/tests/bruno/$folder &&

  # Run the collection
  bru run --env $1 ;

  # Store the exit code
  res=$? ;

  # If it's different than 0 (no error)
  if [ ${res} -ne 0 ]
  then
    # Store the failure status
    status=${res};
    # And the name of the collection that failed
    failedRuns+=(${folder});
  fi;

  # Exit the collection's folder
  cd $rootFolder;
done

if [ ${#failedRuns[@]} -ne 0 ]
then
  echo -e "\nSUMMARY - RUNS WITH FAILURES (scroll above for details):"
  for collection in ${failedRuns[@]}; do
    echo "--- ${collection}"
  done
fi

exit ${status}
