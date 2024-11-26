# Display current env (must be provided as param of the script)
echo "TEST ENVIRONMENT: $1";

# Loop over all bruno collections
for folder in `ls ./src/tests/bruno`;
do
  echo -e "\n\nRUNNING TEST SUITE: $folder" &&

  # Enter the collection's folder
  cd ./src/tests/bruno/$folder &&

  # Run the collection
  bru run --env $1 ;

  # Store the exit code
  res=$? ;

  # If it's different than 0 (no error) or 1 (some tests failed)
  if [ ${res} -ne 0 -a  ${res} -ne 1 ]
  then
    # Abort the script
    exit ${res}
  fi;

  # Exit the collection's folder
  cd -;
done
