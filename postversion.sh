version=`node get_version.js`
image=roboxue/yarn_vision
docker build -t $image:latest .
echo "tagging docker version: $version"
docker tag $image:latest $image:$version
docker push $image:latest
docker push $image:$version
