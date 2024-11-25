echo "TEST ENVIRONMENT: $1";
for folder in `ls ./src/tests/bruno`;
do echo -e "\n\nRUNNING TEST SUITE: $folder" && cd ./src/tests/bruno/$folder && bru run --env $1 ; cd -;
done
