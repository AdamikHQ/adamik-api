# Display current env (must be provided as param of the script)
echo "TEST ENVIRONMENT: $1";

rootFolder=$(pwd);


cd $rootFolder/src/tests/bruno/$folder && bru run --env $1 ;

status=$?;

if [ $status -ne 0 ]
then
  echo -e "\n❌ RUNS WITH FAILURES (scroll above for details):"
else
  echo -e "\n✅ ALL RUNS SUCCESSFUL!"
fi

exit ${status}
